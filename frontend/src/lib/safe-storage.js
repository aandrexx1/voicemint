/** Evita crash se localStorage non è disponibile (privacy, blocco cookie, ecc.) */

export function safeGetItem(key, fallback = null) {
  try {
    const v = localStorage.getItem(key)
    return v === null || v === undefined ? fallback : v
  } catch {
    return fallback
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
