import { useState, useEffect } from "react"
import LandingPage from "./pages/LandingPage"
import FAQDemoPage from "./pages/FAQDemoPage"
import MinimalAuthDemoPage from "./pages/MinimalAuthDemoPage"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import AdminPage from "./pages/AdminPage"
import { SiteParticlesBackground } from "./components/ui/site-particles-background"
import axios from "axios"

const API = "https://voicemint-backend.onrender.com"

function AppShell({ children }) {
  return (
    <>
      <SiteParticlesBackground />
      <div className="relative z-10 min-h-screen">{children}</div>
    </>
  )
}

function App() {
  const [page, setPage] = useState(() => {
    const path = window.location.pathname
    if (path === "/e5426679666b") return "admin"
    if (path === "/faq-demo") return "faq-demo"
    if (path === "/auth-demo") return "auth-demo"
    return "landing"
  })
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

  if (page === "admin")
    return (
      <AppShell>
        <AdminPage />
      </AppShell>
    )
  if (page === "faq-demo")
    return (
      <AppShell>
        <FAQDemoPage />
      </AppShell>
    )
  if (page === "auth-demo")
    return (
      <AppShell>
        <MinimalAuthDemoPage />
      </AppShell>
    )
  if (page === "landing")
    return (
      <AppShell>
        <LandingPage onGetStarted={() => setPage("auth")} onLogin={() => setPage("auth-login")} />
      </AppShell>
    )
  if (page === "auth" || page === "auth-login")
    return (
      <AppShell>
        <AuthPage
          setToken={handleSetToken}
          setUser={setUser}
          onBack={() => setPage("landing")}
          defaultLogin={page === "auth-login"}
        />
      </AppShell>
    )

  return (
    <AppShell>
      <Dashboard token={token} user={user} setUser={setUser} onLogout={handleLogout} />
    </AppShell>
  )
}

export default App
