import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"

const API = "https://voicemint-backend.onrender.com"
const SECRET_PASSWORD = "6g@tteRitte"

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authed) return
    axios.get(`${API}/e5426679666b`).then(res => {
      setStats(res.data)
      setLoading(false)
    })
  }, [authed])

  if (!authed) return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="flex flex-col gap-4 w-64">
        <input
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (pwd === SECRET_PASSWORD) setAuthed(true)
              else setError("Password errata")
            }
          }}
          className="bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30"
        />
        <button
          onClick={() => {
            if (pwd === SECRET_PASSWORD) setAuthed(true)
            else setError("Password errata")
          }}
          className="bg-white text-black font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/90"
        >
          Accedi
        </button>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      </div>
    </div>
  )

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <p className="text-white/30 text-sm">Caricamento...</p>
    </div>
  )

  const cards = [
    { label: "Utenti totali", value: stats.total_users, sub: "registrati" },
    { label: "Piano Free", value: stats.free_users, sub: "utenti attivi" },
    { label: "Piano Pro", value: stats.pro_users, sub: "abbonati" },
    { label: "Waitlist", value: stats.total_waitlist, sub: "in lista" },
    { label: "Conversioni", value: stats.total_conversions, sub: "documenti generati" },
  ]

  return (
    <div className="min-h-screen bg-transparent px-8 py-16 text-white">
      <div className="max-w-4xl mx-auto">
        <p className="text-white/20 text-xs uppercase tracking-widest mb-2">VoiceMint</p>
        <h1 className="text-3xl font-bold tracking-tight mb-16">Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="border border-white/5 rounded-2xl p-6 bg-white/[0.02]"
            >
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">{c.label}</p>
              <p className="text-5xl font-bold tracking-tighter mb-2">{c.value}</p>
              <p className="text-white/20 text-xs">{c.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}