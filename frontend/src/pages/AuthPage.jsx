import { useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { Mic, Mail, Lock, User } from "lucide-react"

const API = "http://127.0.0.1:8000"

export default function AuthPage({ setToken, setUser }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: "", username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const endpoint = isLogin ? "/login" : "/register"
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { email: form.email, username: form.username, password: form.password }

      const res = await axios.post(`${API}${endpoint}`, payload)
      setToken(res.data.token)
      setUser({ username: res.data.username, tier: res.data.tier })
    } catch (err) {
      setError(err.response?.data?.detail || "Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a2e] p-8 rounded-2xl w-full max-w-md shadow-2xl"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-violet-600 p-2 rounded-xl">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">VoiceMint</h1>
        </div>

        <h2 className="text-xl font-semibold text-white mb-6">
          {isLogin ? "Bentornato!" : "Crea il tuo account"}
        </h2>

        {/* Campi */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-[#0f0f1a] rounded-xl px-4 py-3">
            <Mail className="w-5 h-5 text-violet-400" />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handle}
              className="bg-transparent text-white placeholder-gray-500 outline-none w-full"
            />
          </div>

          {!isLogin && (
            <div className="flex items-center gap-3 bg-[#0f0f1a] rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-violet-400" />
              <input
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handle}
                className="bg-transparent text-white placeholder-gray-500 outline-none w-full"
              />
            </div>
          )}

          <div className="flex items-center gap-3 bg-[#0f0f1a] rounded-xl px-4 py-3">
            <Lock className="w-5 h-5 text-violet-400" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handle}
              className="bg-transparent text-white placeholder-gray-500 outline-none w-full"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {loading ? "Caricamento..." : isLogin ? "Accedi" : "Registrati"}
        </button>

        <p className="text-gray-500 text-sm text-center mt-4">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-violet-400 ml-1 hover:underline"
          >
            {isLogin ? "Registrati" : "Accedi"}
          </button>
        </p>
      </motion.div>
    </div>
  )
}