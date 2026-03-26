const STORAGE_KEY = "cookie_consent"
const LEGACY_KEY = "cookie_accepted"

/** @returns {null | "accepted" | "rejected"} */
export function readCookieConsent() {
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === "accepted" || v === "rejected") return v
  if (localStorage.getItem(LEGACY_KEY) === "true") {
    localStorage.setItem(STORAGE_KEY, "accepted")
    localStorage.removeItem(LEGACY_KEY)
    return "accepted"
  }
  return null
}

/** @param {"accepted" | "rejected"} value */
export function writeCookieConsent(value) {
  localStorage.setItem(STORAGE_KEY, value)
  localStorage.removeItem(LEGACY_KEY)
}
