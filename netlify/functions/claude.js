// Serverless proxy for Claude API calls.
//
// This runs on Netlify's servers, not in the browser. It reads the real
// Anthropic API key from a Netlify environment variable (ANTHROPIC_API_KEY),
// which is set once in the Netlify dashboard (Site settings > Environment
// variables) — never written to this file, never committed to the repo.
//
// The browser (js/ai/client.js) calls this function at a relative path
// ("/.netlify/functions/claude") instead of calling Anthropic directly, so
// the real key never has to reach the browser at all.

const API_URL = "https://api.anthropic.com/v1/messages";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          "Server is missing ANTHROPIC_API_KEY. Set it in Netlify: Site settings > Environment variables.",
      }),
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  try {
    const anthropicResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    const text = await anthropicResponse.text();
    return {
      statusCode: anthropicResponse.status,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Failed to reach Anthropic API: ${err.message}` }),
    };
  }
};
