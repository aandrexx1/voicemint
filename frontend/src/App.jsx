import { useState, useEffect } from "react"
import LandingPage from "./pages/LandingPage"
import FAQDemoPage from "./pages/FAQDemoPage"
import MinimalAuthDemoPage from "./pages/MinimalAuthDemoPage"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import AdminPage from "./pages/AdminPage"
import LegalPage from "./pages/LegalPage"
import { SiteParticlesBackground } from "./components/ui/site-particles-background"
import { CookieConsentBanner } from "./components/cookie-consent-banner"
import { readCookieConsent, writeCookieConsent } from "./lib/cookie-consent"
import axios from "axios"

const API = "https://voicemint-backend.onrender.com"

function getInitialPage() {
  const path = window.location.pathname.replace(/\/$/, "") || "/"
  if (path === "/e5426679666b") return "admin"
  if (path === "/faq-demo") return "faq-demo"
  if (path === "/auth-demo") return "auth-demo"
  if (path === "/terms") return "terms"
  if (path === "/privacy") return "privacy"
  return "landing"
}

function AppShell({ children }) {
  return (
    <>
      <SiteParticlesBackground />
      <div className="relative z-10 min-h-screen">{children}</div>
    </>
  )
}

function App() {
  const [page, setPage] = useState(getInitialPage)
  const [legalReturn, setLegalReturn] = useState("landing")
  const [cookieConsent, setCookieConsent] = useState(readCookieConsent)
  const [token, setToken] = useState(localStorage.getItem("token") || null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token && !user) {
      axios
        .get(`${API}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data)
        })
        .catch(() => {
          setToken(null)
          localStorage.removeItem("token")
        })
    }
  }, [token])

  const handleSetToken = (t) => {
    setToken(t)
    localStorage.setItem("token", t)
    setPage("dashboard")
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    setPage("landing")
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
    if (page === "terms") return <LegalPage variant="terms" onBack={handleLegalBack} />
    if (page === "privacy") return <LegalPage variant="privacy" onBack={handleLegalBack} />
    if (page === "landing")
      return (
        <LandingPage
          onGetStarted={() => setPage("auth")}
          onLogin={() => setPage("auth-login")}
          onOpenTerms={goTerms}
          onOpenPrivacy={goPrivacy}
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
    return (
      <Dashboard
        token={token}
        user={user}
        setUser={setUser}
        onLogout={handleLogout}
        onOpenTerms={goTerms}
        onOpenPrivacy={goPrivacy}
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
