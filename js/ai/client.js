// Single call-site abstraction for talking to the Claude API.
//
// Every AI feature in this app goes through this one function.
//
// Primary path: a Netlify serverless function (netlify/functions/claude.js)
// holds the real API key server-side and proxies the request. This is what
// runs on the deployed site — no one has to paste a key to use it.
//
// Fallback path: if the proxy isn't reachable (e.g. running locally with a
// plain static server, not Netlify, so "/.netlify/functions/..." doesn't
// exist), fall back to calling Anthropic directly using a key pasted into
// Settings. This keeps local testing working without extra tooling.

import { getApiKey } from "../settings.js";

const MODEL = "claude-opus-4-6";
const PROXY_URL = "/.netlify/functions/claude";
const DIRECT_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ maxTokens?: number, system?: string }} [options]
 * @returns {Promise<string>} the text of Claude's reply
 */
export async function callClaude(messages, { maxTokens = 1500, system } = {}) {
  const body = { model: MODEL, max_tokens: maxTokens, messages };
  if (system) body.system = system;

  const proxyResult = await tryProxy(body);
  if (proxyResult.ok) return extractText(proxyResult.data);
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

  const response = await fetch(DIRECT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errText}`);
  }

  return extractText(await response.json());
}

async function tryProxy(body) {
  let response;
  try {
    response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Network-level failure reaching the proxy at all — treat as "unavailable"
    // and let the caller fall back, rather than a hard error.
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

  return { ok: true, data: await response.json() };
}

function extractText(data) {
  const textBlock = data.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}
