import { safeGetItem, safeRemoveItem, safeSetItem } from "./safe-storage"

const STORAGE_KEY = "cookie_consent"
const LEGACY_KEY = "cookie_accepted"

/** @returns {null | "accepted" | "rejected"} */
export function readCookieConsent() {
  const v = safeGetItem(STORAGE_KEY)
  if (v === "accepted" || v === "rejected") return v
  if (safeGetItem(LEGACY_KEY) === "true") {
    safeSetItem(STORAGE_KEY, "accepted")
    safeRemoveItem(LEGACY_KEY)
    return "accepted"
  }
  return null
}

/** @param {"accepted" | "rejected"} value */
export function writeCookieConsent(value) {
  safeSetItem(STORAGE_KEY, value)
  safeRemoveItem(LEGACY_KEY)
}
