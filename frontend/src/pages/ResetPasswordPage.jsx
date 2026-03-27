import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"

const API = import.meta.env.VITE_API_URL || "https://voicemint-backend.onrender.com"

const inputClass =
  "flex h-11 w-full rounded-full border border-input bg-background/50 px-4 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export default function ResetPasswordPage({ onGoLogin }) {
  const token = new URLSearchParams(window.location.search).get("token") || ""
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submit = async () => {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      if (!token) throw new Error("missing_token")
      await axios.post(`${API}/reset-password`, {
        token,
        new_password: newPassword,
      })

      setMessage("Password aggiornata. Ti reindirizziamo al login…")
      setTimeout(() => onGoLogin?.(), 2000)
    } catch (err) {
      setError("Token non valido o richiesta non riuscita.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6 border border-white/10 rounded-3xl p-6 bg-white/[0.03]">
        <div>
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="mt-2 text-sm text-white/45">
            Inserisci la tua nuova password.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="reset-password" className="text-xs font-medium text-white/60">
            Nuova password
          </label>
          <input
            id="reset-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-green-400">{message}</p> : null}

        <Button type="button" size="lg" className="w-full" disabled={loading} onClick={submit}>
          {loading ? "Caricamento…" : "Aggiorna password"}
        </Button>

        <button
          type="button"
          onClick={onGoLogin}
          className="block w-full text-center text-xs text-white/50 hover:text-white transition-colors"
        >
          Torna al login
        </button>
      </div>
    </div>
  )
}

