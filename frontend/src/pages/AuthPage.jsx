import { useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"

const API = "https://voicemint-backend.onrender.com"

export default function AuthPage({ setToken, setUser, onBack, defaultLogin }) {
  const [isLogin, setIsLogin] = useState(defaultLogin ?? false)
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
      setUser({
        username: res.data.username,
        tier: res.data.tier,
        lifetime_pro: res.data.lifetime_pro,
        registration_number: res.data.registration_number
      })
    } catch (err) {
      setError(err.response?.data?.detail || "Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* Sinistra — branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 border-r border-white/5 p-12">
        <img
          src="/text_logo.png"
          alt="VoiceMint"
          className="h-10 object-contain cursor-pointer"
          onClick={onBack}
        />
        <div>
          <p className="text-white/20 text-xs uppercase tracking-widest mb-6">Voice to Document</p>
          <h2 className="text-5xl font-bold leading-tight tracking-tight mb-6">
            <span className="text-white/30">Trasforma</span> la tua voce in documenti pronti all'uso.
          </h2>
          <p className="text-white/30 text-sm leading-relaxed max-w-sm">
            Parla liberamente. VoiceMint genera presentazioni PPT, PDF professionali e siti web completi in pochi secondi.
          </p>
        </div>
        <p className="text-white/10 text-xs">© 2026 VoiceMint</p>
      </div>

      {/* Destra — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-all text-xs mb-12"
          >
            ← Torna alla home
          </button>
          <p className="text-white/30 text-xs uppercase tracking-widest mb-8">
            {isLogin ? "Accedi" : "Registrati"}
          </p>
          <h1 className="text-3xl font-bold mb-10">
            {isLogin ? "Bentornato." : "Crea il tuo account."}
          </h1>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-white/30 text-xs mb-2">Email</p>
              <input
                name="email"
                type="email"
                placeholder="nome@email.com"
                value={form.email}
                onChange={handle}
                className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
              />
            </div>

            {!isLogin && (
              <div>
                <p className="text-white/30 text-xs mb-2">Username</p>
                <input
                  name="username"
                  placeholder="il tuo username"
                  value={form.username}
                  onChange={handle}
                  className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
                />
              </div>
            )}

            <div>
              <p className="text-white/30 text-xs mb-2">Password</p>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 disabled:opacity-30 transition-all mb-6"
          >
            {loading ? "Caricamento..." : isLogin ? "Accedi" : "Registrati"}
          </button>

          <p className="text-white/30 text-xs text-center">
            {isLogin ? "Non hai un account?" : "Hai già un account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white ml-1 hover:text-white/70 transition-all"
            >
              {isLogin ? "Registrati" : "Accedi"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}