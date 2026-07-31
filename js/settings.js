// API key storage.
//
// The Anthropic API key is entered by the clinician at runtime and held only
// in sessionStorage — never written to disk, never committed, cleared when
// the browser tab closes or when the user clicks "Clear".
//
// The Settings screen's DOM wiring lives in main.js, alongside every other
// section (login, patients, checklist, report), so navigation is consistent
// across the app.

const API_KEY_SESSION_KEY = "cat_anthropic_api_key";

export function getApiKey() {
  return sessionStorage.getItem(API_KEY_SESSION_KEY) || "";
}

export function setApiKey(key) {
  sessionStorage.setItem(API_KEY_SESSION_KEY, key);
}

export function clearApiKey() {
  sessionStorage.removeItem(API_KEY_SESSION_KEY);
}
