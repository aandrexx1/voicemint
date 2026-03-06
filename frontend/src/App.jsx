import { useState } from "react"
import AuthPage from "./pages/AuthPage"
import Dashboard from "./pages/Dashboard"


function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {!token ? (
        <AuthPage setToken={setToken} setUser={setUser} />
      ) : (
        <Dashboard token={token} user={user} onLogout={() => { setToken(null); setUser(null) }} />
      )}
    </div>
  )
}

export default App