import { useState, useEffect, useRef } from "react"
import LandingPage from "./pages/LandingPage"
import FAQDemoPage from "./pages/FAQDemoPage"
import MinimalAuthDemoPage from "./pages/MinimalAuthDemoPage"
import FooterDemoPage from "./pages/FooterDemoPage"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import AdminPage from "./pages/AdminPage"
import LegalPage from "./pages/LegalPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import ProfilePage from "./pages/ProfilePage"
import ContactSalesPage from "./pages/ContactSalesPage"
import { SiteParticlesBackground } from "./components/ui/site-particles-background"
import { CookieConsentBanner } from "./components/cookie-consent-banner"
import { readCookieConsent, writeCookieConsent } from "./lib/cookie-consent"
import { safeGetItem, safeRemoveItem, safeSetItem } from "./lib/safe-storage"
import axios from "axios"

const API = import.meta.env.VITE_API_URL || "https://voicemint-backend.onrender.com"

axios.defaults.withCredentials = true

function getInitialPage() {
  const path = window.location.pathname.replace(/\/$/, "") || "/"
  if (path === "/e5426679666b") return "admin"
  if (path === "/faq-demo") return "faq-demo"
  if (path === "/auth-demo") return "auth-demo"
  if (path === "/footer-demo") return "footer-demo"
  if (path === "/terms") return "terms"
  if (path === "/privacy") return "privacy"
  if (path === "/reset-password") return "reset-password"
  if (path === "/profile") return "profile"
  if (path === "/contact-sales") return "contact-sales"
  return "landing"
}

function AppShell({ children }) {
  return (
    <>
      <SiteParticlesBackground />
      <div className="relative z-10 min-h-screen bg-transparent">{children}</div>
    </>
  )
}

function App() {
  const [page, setPage] = useState(getInitialPage)
  const [legalReturn, setLegalReturn] = useState("landing")
  const [cookieConsent, setCookieConsent] = useState(readCookieConsent)
  const [token, setToken] = useState(() => safeGetItem("token"))
  const [user, setUser] = useState(null)
  /** Evita GET /me subito dopo logout (race: sessione ancora valida → utente ripristinato). */
  const skipNextMeFetch = useRef(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hash = (window.location.hash || "").replace(/^#/, "")
    const hashParams = new URLSearchParams(hash)

    const ot = searchParams.get("oauth_token") || hashParams.get("oauth_token")
    const oe = searchParams.get("oauth_error") || hashParams.get("oauth_error")
    const oauthSuccess = hashParams.get("oauth") === "success"
    if (oe) sessionStorage.setItem("oauth_error", oe)
    if (ot) {
      safeSetItem("token", ot)
      setToken(ot)
      setUser(null)
    }
    if (ot || oe) {
      const u = new URL(window.location.href)
      u.searchParams.delete("oauth_token")
      u.searchParams.delete("oauth_error")
      // pulisci hash token/error
      u.hash = ""
      const qs = u.searchParams.toString()
      window.history.replaceState({}, "", u.pathname + (qs ? `?${qs}` : ""))
    }
    if (oauthSuccess) {
      const u = new URL(window.location.href)
      u.hash = ""
      window.history.replaceState({}, "", u.pathname + u.search)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      if (skipNextMeFetch.current) {
        skipNextMeFetch.current = false
        return
      }
      axios
        .get(`${API}/me`, {
          headers: token && token !== "cookie" ? { Authorization: `Bearer ${token}` } : {},
        })
        .then((res) => {
          setUser(res.data)
          if (!token) setToken("cookie")
        })
        .catch(() => {
          setToken(null)
          safeRemoveItem("token")
        })
    }
  }, [token])

  useEffect(() => {
    const onPop = () => setPage(getInitialPage())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const handleSetToken = (t) => {
    setToken(t)
    // prefer cookie HttpOnly: teniamo il token solo in memoria
    window.history.pushState({}, "", "/")
    setPage("landing")
  }

  const handleLogout = async () => {
    try {
      // Ensure cookie is cleared server-side before reloading/navigating.
      await axios.post(`${API}/logout`)
    } catch {
      // Even if logout fails, we still clear the local frontend state.
    } finally {
      skipNextMeFetch.current = true
      setToken(null)
      setUser(null)
      safeRemoveItem("token")
      setPage("landing")
    }
  }

  const goTerms = () => {
    if (page !== "terms") setLegalReturn(page)
    setPage("terms")
  }

  const goPrivacy = () => {
    if (page !== "privacy") setLegalReturn(page)
    setPage("privacy")
  }

  const handleLegalBack = () => {
    setPage(legalReturn)
  }

  const acceptCookies = () => {
    writeCookieConsent("accepted")
    setCookieConsent("accepted")
  }

  const rejectCookies = () => {
    writeCookieConsent("rejected")
    setCookieConsent("rejected")
  }

  const renderPage = () => {
    if (page === "admin") return <AdminPage />
    if (page === "faq-demo") return <FAQDemoPage />
    if (page === "auth-demo") return <MinimalAuthDemoPage />
    if (page === "footer-demo") return <FooterDemoPage />
    if (page === "terms") return <LegalPage variant="terms" onBack={handleLegalBack} />
    if (page === "privacy") return <LegalPage variant="privacy" onBack={handleLegalBack} />
    if (page === "landing")
      return (
        <LandingPage
          token={token}
          user={user}
          onGetStarted={() => setPage("auth")}
          onLogin={() => setPage("auth-login")}
          onOpenTerms={goTerms}
          onOpenPrivacy={goPrivacy}
          onOpenProfile={() => {
            if (token) {
              window.history.pushState({}, "", "/profile")
              setPage("profile")
            } else {
              setPage("auth") // registration
            }
          }}
          onContactSales={() => setPage("contact-sales")}
        />
      )
    if (page === "auth" || page === "auth-login")
      return (
        <AuthPage
          setToken={handleSetToken}
          setUser={setUser}
          onBack={() => setPage("landing")}
          defaultLogin={page === "auth-login"}
          onOpenTerms={goTerms}
          onOpenPrivacy={goPrivacy}
        />
      )
    if (page === "reset-password")
      return (
        <ResetPasswordPage
          onGoLogin={() => {
            window.history.pushState({}, "", "/")
            setPage("auth-login")
          }}
        />
      )
    if (page === "profile")
      return (
        <ProfilePage
          token={token}
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
          onGoHome={() => {
            window.history.pushState({}, "", "/")
            setPage("landing")
          }}
        />
      )
    if (page === "contact-sales")
      return (
        <ContactSalesPage
          onBack={() => {
            window.history.pushState({}, "", "/")
            setPage("landing")
          }}
        />
      )
    // Fallback: se arriviamo qui, torniamo alla landing
    return (
      <LandingPage
        token={token}
        user={user}
        onGetStarted={() => setPage("auth")}
        onLogin={() => setPage("auth-login")}
        onOpenTerms={goTerms}
        onOpenPrivacy={goPrivacy}
        onOpenProfile={() => {
          if (token) {
            window.history.pushState({}, "", "/profile")
            setPage("profile")
          } else {
            setPage("auth")
          }
        }}
        onContactSales={() => setPage("contact-sales")}
      />
    )
  }

  return (
    <>
      <AppShell>{renderPage()}</AppShell>
      {cookieConsent === null && (
        <CookieConsentBanner
          onAccept={acceptCookies}
          onReject={rejectCookies}
          onOpenTerms={goTerms}
          onOpenPrivacy={goPrivacy}
        />
      )}
    </>
  )
}

export default App
