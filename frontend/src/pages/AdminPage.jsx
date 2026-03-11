import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"

const API = "https://voicemint-production.up.railway.app"

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/e5426679666b`).then(res => {
      setStats(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#0a0a0a] text-white px-8 py-16">
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