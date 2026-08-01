// Serverless proxy for Claude API calls — streaming version.
//
// This runs on Netlify's servers, not in the browser. It reads the real
// Anthropic API key from a Netlify environment variable (ANTHROPIC_API_KEY),
// which is set once in the Netlify dashboard (Site settings > Environment
// variables) — never written to this file, never committed to the repo.
//
// The browser (js/ai/client.js) calls this function at a relative path
// ("/.netlify/functions/claude") instead of calling Anthropic directly, so
// the real key never has to reach the browser at all.
//
// This is written using Netlify's newer "V2" function signature (a plain
// `export default` taking/returning standard Fetch API Request/Response
// objects) instead of the older `exports.handler` style, specifically so it
// can stream Anthropic's response straight back to the browser as it
// arrives, rather than waiting for the whole thing and returning it in one
// go. That matters because a full non-streamed response (especially the
// longer caregiver-friendly rewrite) can take long enough to generate that
// some networks/proxies kill the connection for looking "idle" — streaming
// keeps bytes flowing continuously so that never happens. No extra
// dependencies or build step needed; Netlify's own build detects this
// export shape and bundles it accordingly.

const API_URL = "https://api.anthropic.com/v1/messages";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Server is missing ANTHROPIC_API_KEY. Set it in Netlify: Site settings > Environment variables.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let anthropicResponse;
  try {
    anthropicResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to reach Anthropic API: ${err.message}` }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Stream Anthropic's response straight through to the browser instead of
  // buffering it here. If the request body didn't ask for a stream (or
  // Anthropic returned a non-streamed error body), this still passes the
  // body through untouched.
  return new Response(anthropicResponse.body, {
    status: anthropicResponse.status,
    headers: {
      "Content-Type": anthropicResponse.headers.get("Content-Type") || "application/json",
    },
  });
};
