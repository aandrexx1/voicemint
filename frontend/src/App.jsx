import { useState, useEffect, useRef } from "react"
import LandingPage from "./pages/LandingPage"
import FAQDemoPage from "./pages/FAQDemoPage"
import MinimalAuthDemoPage from "./pages/MinimalAuthDemoPage"
import FooterDemoPage from "./pages/FooterDemoPage"
import AuthPage from "./pages/AuthPage"
import WorkspacePage from "./pages/WorkspacePage"
import HelpCenterPage from "./pages/HelpCenterPage"
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
  if (path === "/home") return "landing-public"
  if (path === "/help") return "help"
  if (path === "/app") return "workspace"
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
  /** True dopo il primo tentativo di sessione (/me o skip), per /app senza login. */
  const [sessionResolved, setSessionResolved] = useState(false)
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
    if (user) {
      setSessionResolved(true)
      return
    }
    if (skipNextMeFetch.current) {
      skipNextMeFetch.current = false
      setSessionResolved(true)
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
      .finally(() => setSessionResolved(true))
  }, [token, user])

  /** Loggato sulla root `/` → workspace (marketing solo per ospiti su `/`). */
  useEffect(() => {
    if (!user) return
    const path = window.location.pathname.replace(/\/$/, "") || "/"
    if (path === "/" || path === "") {
      window.history.replaceState({}, "", "/app")
      setPage("workspace")
    }
  }, [user])

  useEffect(() => {
    const onPop = () => setPage(getInitialPage())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const handleSetToken = (t) => {
    setToken(t)
    window.history.pushState({}, "", "/app")
    setPage("workspace")
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
      window.history.replaceState({}, "", "/")
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

  const openHomeInNewTab = () => {
    window.open(`${window.location.origin}/home`, "_blank", "noopener,noreferrer")
  }

  const openHelpInNewTab = () => {
    window.open(`${window.location.origin}/help`, "_blank", "noopener,noreferrer")
  }

  const landingProps = {
    token,
    user,
    onGetStarted: () => setPage("auth"),
    onLogin: () => setPage("auth-login"),
    onOpenTerms: goTerms,
    onOpenPrivacy: goPrivacy,
    onOpenProfile: () => {
      if (user || token) {
        window.history.pushState({}, "", "/app")
        setPage("workspace")
      } else {
        setPage("auth")
      }
    },
    onContactSales: () => setPage("contact-sales"),
  }

  const acceptCookies = () => {
    writeCookieConsent("accepted")
    setCookieConsent("accepted")
  }

  const rejectCookies = () => {
    writeCookieConsent("rejected")
    setCookieConsent("rejected")
  }

  const openCookiePreferences = () => {
    // Forza la riapertura del banner.
    setCookieConsent(null)
  }

  const renderPage = () => {
    if (page === "admin") return <AdminPage />
    if (page === "faq-demo") return <FAQDemoPage />
    if (page === "auth-demo") return <MinimalAuthDemoPage />
    if (page === "footer-demo") return <FooterDemoPage />
    if (page === "terms") return <LegalPage variant="terms" onBack={handleLegalBack} />
    if (page === "privacy") return <LegalPage variant="privacy" onBack={handleLegalBack} />
    if (page === "help")
      return (
        <HelpCenterPage
          onBack={() => {
            if (user) {
              window.history.pushState({}, "", "/app")
              setPage("workspace")
            } else {
              window.history.replaceState({}, "", "/")
              setPage("landing")
            }
          }}
        />
      )
    if (page === "workspace") {
      if (!user) {
        if (!sessionResolved) {
          return (
            <div className="flex min-h-screen items-center justify-center text-sm text-white/50">
              Caricamento…
            </div>
          )
        }
        return (
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <p className="text-sm text-white/60">Accedi per usare la workspace.</p>
            <button
              type="button"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
              onClick={() => {
                window.history.replaceState({}, "", "/")
                setPage("auth-login")
              }}
            >
              Accedi
            </button>
          </div>
        )
      }
      return (
        <WorkspacePage
          token={token}
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
          onOpenTerms={goTerms}
          onOpenPrivacy={goPrivacy}
          openHomeInNewTab={openHomeInNewTab}
          openHelpInNewTab={openHelpInNewTab}
          onOpenCookiePreferences={openCookiePreferences}
        />
      )
    }
    if (page === "landing-public") return <LandingPage {...landingProps} />
    if (page === "landing") return <LandingPage {...landingProps} />
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
            window.history.pushState({}, "", "/app")
            setPage("workspace")
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
    return <LandingPage {...landingProps} />
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
