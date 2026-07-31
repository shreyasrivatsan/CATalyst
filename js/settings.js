// API key settings panel.
//
// The Anthropic API key is entered by the clinician at runtime and held only
// in sessionStorage — never written to disk, never committed, cleared when
// the browser tab closes or when the user clicks "Clear".

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

export function initSettingsPanel() {
  const panel = document.getElementById("settings-panel");
  const openBtn = document.getElementById("open-settings-btn");
  const closeBtn = document.getElementById("close-settings-btn");
  const saveBtn = document.getElementById("save-api-key-btn");
  const clearBtn = document.getElementById("clear-api-key-btn");
  const input = document.getElementById("api-key-input");
  const statusEl = document.getElementById("api-key-status");

  if (!panel || !openBtn) return;

  function refreshStatus() {
    statusEl.textContent = getApiKey()
      ? "An API key is set for this browser tab."
      : "No API key set.";
  }

  openBtn.addEventListener("click", () => {
    input.value = getApiKey();
    refreshStatus();
    panel.hidden = false;
  });

  closeBtn.addEventListener("click", () => {
    panel.hidden = true;
  });

  saveBtn.addEventListener("click", () => {
    const key = input.value.trim();
    if (key) {
      setApiKey(key);
      refreshStatus();
    }
  });

  clearBtn.addEventListener("click", () => {
    clearApiKey();
    input.value = "";
    refreshStatus();
  });
}
