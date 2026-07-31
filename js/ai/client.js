// Single call-site abstraction for talking to the Claude API.
//
// Every AI feature in this app goes through this one function. If we switch
// from runtime-entered keys to a serverless proxy later (window 2), only
// this file needs to change.

import { getApiKey } from "../settings.js";

const MODEL = "claude-opus-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ maxTokens?: number, system?: string }} [options]
 * @returns {Promise<string>} the text of Claude's reply
 */
export async function callClaude(messages, { maxTokens = 1500, system } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No Anthropic API key set. Open Settings and add your API key first.");
  }

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const response = await fetch(API_URL, {
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

  const data = await response.json();
  const textBlock = data.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}
