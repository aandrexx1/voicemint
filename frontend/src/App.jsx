import { useState } from "react"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"
import AdminPage from "./pages/AdminPage"

function App() {
  const [page, setPage] = useState(
    window.location.pathname === "/e5426679666b" ? "admin" : "landing"
  )
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  if (page === "admin") return <AdminPage />

  if (page === "landing") return <LandingPage 
    onGetStarted={() => setPage("auth")} 
    onLogin={() => setPage("auth-login")}
  />

  if (page === "auth" || page === "auth-login") return (
    <AuthPage
      setToken={(t) => { setToken(t); setPage("dashboard") }}
      setUser={setUser}
      onBack={() => setPage("landing")}
      defaultLogin={page === "auth-login"}
    />
  )

  return <Dashboard token={token} user={user} onLogout={() => { setToken(null); setPage("landing") }} />
}

export default App