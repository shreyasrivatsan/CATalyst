// Single call-site abstraction for talking to the Claude API.
//
// Every AI feature in this app goes through this one function.
//
// Requests are always streamed: Claude's response arrives incrementally
// instead of as one big blob at the end. This matters for two reasons —
// (1) it lets the UI show text appearing live instead of a long silent
// wait, and (2) it keeps the underlying connection actively sending bytes,
// which avoids "inactivity timeout" errors from networks/proxies that kill
// connections that go quiet too long (a longer non-streamed response, like
// the caregiver-friendly rewrite, can take 15-30+ seconds to generate).
//
// Primary path: a Netlify serverless function (netlify/functions/claude.js)
// holds the real API key server-side and proxies the streamed request.
// This is what runs on the deployed site — no one has to paste a key.
//
// Fallback path: if the proxy isn't reachable (e.g. running locally with a
// plain static server, not Netlify, so "/.netlify/functions/..." doesn't
// exist), fall back to calling Anthropic directly using a key pasted into
// Settings. Also streamed, so the same behavior applies locally.

import { getApiKey } from "../settings.js";

const MODEL = "claude-opus-4-6";
const PROXY_URL = "/.netlify/functions/claude";
const DIRECT_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ maxTokens?: number, system?: string, onDelta?: (textSoFar: string) => void }} [options]
 * @returns {Promise<string>} the full text of Claude's reply, once complete
 */
export async function callClaude(messages, { maxTokens = 1500, system, onDelta } = {}) {
  const body = { model: MODEL, max_tokens: maxTokens, messages, stream: true };
  if (system) body.system = system;

  const proxyResult = await tryFetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (proxyResult.ok) return consumeStream(proxyResult.response, onDelta);
  if (proxyResult.hardError) throw proxyResult.hardError;

  // Proxy unreachable (local static server, no Netlify functions available) —
  // fall back to a manually entered key.
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Could not reach the AI proxy. If you're testing the deployed Netlify site, " +
        "this is a real error — check the function logs in the Netlify dashboard. " +
        "If you're testing locally without Netlify, open Settings and add your API key."
    );
  }

  const directResult = await tryFetch(DIRECT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  if (directResult.hardError) throw directResult.hardError;
  if (!directResult.ok) {
    throw new Error("Could not reach the Anthropic API directly.");
  }

  return consumeStream(directResult.response, onDelta);
}

async function tryFetch(url, fetchOptions) {
  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    // Network-level failure reaching this URL at all — treat as
    // "unavailable" and let the caller fall back, rather than a hard error.
    return { ok: false };
  }

  if (response.status === 404) {
    // No function deployed at this path (e.g. plain static server) — fall back.
    return { ok: false };
  }

  if (!response.ok) {
    const errText = await response.text();
    return { ok: false, hardError: new Error(`Claude API error (${response.status}): ${errText}`) };
  }

  return { ok: true, response };
}

// Reads Claude's server-sent-events stream and reassembles the text,
// calling onDelta(textSoFar) as each chunk arrives so the UI can update
// live. Resolves with the full text once the stream ends.
async function consumeStream(response, onDelta) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      text = handleEvent(rawEvent, text, onDelta);
    }
  }

  return text;
}

// Parses one SSE "event" block (the lines between blank-line separators)
// from Anthropic's stream format and, if it's a text delta, appends it.
function handleEvent(rawEvent, textSoFar, onDelta) {
  const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
  if (!dataLine) return textSoFar;

  const jsonStr = dataLine.slice(5).trim();
  if (!jsonStr) return textSoFar;

  let event;
  try {
    event = JSON.parse(jsonStr);
  } catch (err) {
    return textSoFar; // ignore malformed chunk
  }

  if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
    const updated = textSoFar + event.delta.text;
    if (onDelta) onDelta(updated);
    return updated;
  }

  if (event.type === "error") {
    throw new Error(`Claude API error: ${event.error?.message || "unknown error"}`);
  }

  return textSoFar;
}
