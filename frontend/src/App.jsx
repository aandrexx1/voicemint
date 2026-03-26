import { useState, useEffect } from "react"
import LandingPage from "./pages/LandingPage"
import FAQDemoPage from "./pages/FAQDemoPage"
import MinimalAuthDemoPage from "./pages/MinimalAuthDemoPage"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import AdminPage from "./pages/AdminPage"
import axios from "axios"

const API = "https://voicemint-backend.onrender.com"

function App() {
  const [page, setPage] = useState(() => {
    const path = window.location.pathname
    if (path === "/e5426679666b") return "admin"
    if (path === "/faq-demo") return "faq-demo"
    return "landing"
  })
  const [token, setToken] = useState(localStorage.getItem("token") || null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token && !user) {
      axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data)
      }).catch(() => {
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

  if (page === "admin") return <AdminPage />
  if (page === "faq-demo") return <FAQDemoPage />
  if (page === "auth-demo") return <MinimalAuthDemoPage />
  if (page === "landing") return <LandingPage onGetStarted={() => setPage("auth")} onLogin={() => setPage("auth-login")} />
  if (page === "auth" || page === "auth-login") return <AuthPage setToken={handleSetToken} setUser={setUser} onBack={() => setPage("landing")} defaultLogin={page === "auth-login"} />

  return <Dashboard token={token} user={user} setUser={setUser} onLogout={handleLogout} />
}

export default App