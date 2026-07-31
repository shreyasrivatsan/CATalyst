// Minimal clinician "login" stub.
//
// This is NOT real authentication — there's no password, no account system.
// It just captures a clinician name for the session so reports can be
// attributed to someone. This is intentionally a thin, swappable layer:
// replace the internals here with a real login system later without
// touching any calling code (main.js only calls getCurrentUser/login/logout).

const CLINICIAN_KEY = "cat_clinician_name";

export function getCurrentUser() {
  return sessionStorage.getItem(CLINICIAN_KEY) || null;
}

export function login(name) {
  sessionStorage.setItem(CLINICIAN_KEY, name);
}

export function logout() {
  sessionStorage.removeItem(CLINICIAN_KEY);
}
