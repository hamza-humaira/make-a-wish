/** Persists mute preference across Landing ↔ Sky navigations (same tab). */
export const AMBIENT_SESSION_KEY = "starwish_ambient_on"

export function readAmbientEnabled(): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(AMBIENT_SESSION_KEY) === "1"
  } catch {
    return false
  }
}

export function writeAmbientEnabled(on: boolean) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(AMBIENT_SESSION_KEY, on ? "1" : "0")
  } catch {
    /* private mode etc. */
  }
}
