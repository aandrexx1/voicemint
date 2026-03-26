import { useState, useRef, useEffect } from "react"
import { Mic, Download, LogOut, FileText, User, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"

const API = "https://voicemint-backend.onrender.com"

export default function Dashboard({ token, user, setUser, onLogout }) {
  const [recording, setRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [outputType] = useState("ppt") // Genera solo presentazioni PowerPoint
  const [loading, setLoading] = useState(false)
  const [conversions, setConversions] = useState([])
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [modal, setModal] = useState(null) // "settings" | "plans"
  const [lang, setLang] = useState(localStorage.getItem("lang") || "it")
  const profileRef = useRef(null)

  // Chiudi menu profilo cliccando fuori
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("file", blob, "recording.webm")
      try {
        const res = await axios.post(`${API}/upload-audio`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTranscription(res.data.transcription)
      } catch {
        setTranscription("Errore nella trascrizione")
      }
    }
    recorder.start()
    setMediaRecorder(recorder)
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.stop()
    setRecording(false)
  }

  const generate = async () => {
    if (!transcription) return
    setLoading(true)
    try {
      const res = await axios.post(
        `${API}/generate?transcription=${encodeURIComponent(transcription)}&output_type=${outputType}`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      )
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = "voicemint.pptx"
      a.click()
      setConversions(prev => [{ title: transcription.slice(0, 50) + "...", type: outputType, url }, ...prev])
    } catch {
      alert("Errore nella generazione")
    } finally {
      setLoading(false)
    }
  }

  const isProUser = user?.tier === "pro"
  const isLifetimePro = user?.lifetime_pro
  const userInitial = (user?.username || user?.email || "U")[0].toUpperCase()

  const t = (it, en) => lang === "it" ? it : en

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-white" />
          <span className="font-semibold text-sm tracking-tight">VoiceMint</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Lang switcher */}
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => { setLang("it"); localStorage.setItem("lang", "it") }}
              className={lang === "it" ? "text-white" : "text-white/30 hover:text-white transition-all"}>IT</button>
            <span className="text-white/20">|</span>
            <button onClick={() => { setLang("en"); localStorage.setItem("lang", "en") }}
              className={lang === "en" ? "text-white" : "text-white/30 hover:text-white transition-all"}>EN</button>
          </div>

          {/* Profilo */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-semibold">
                {userInitial}
              </div>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 bg-[#111] border border-white/10 rounded-2xl overflow-hidden z-50"
                >
                  {/* Header menu */}
                  <div className="px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-base font-semibold">
                        {userInitial}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{user?.username}</p>
                        <p className="text-white/30 text-xs">{user?.email}</p>
                      </div>
                    </div>
                    {isProUser && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <p className="text-green-400 text-xs font-semibold">
                          {isLifetimePro
                            ? t("Pro a vita", "Lifetime Pro")
                            : t("Pro utente", "Pro user")}
                        </p>
                      </div>
                    )}
                    {!isProUser && (
                      <p className="text-white/30 text-xs mt-2">
                        {t(`${user?.monthly_usage || 0} crediti usati questo mese`, `${user?.monthly_usage || 0} credits used this month`)}
                      </p>
                    )}
                  </div>

                  {/* Voci menu */}
                  <div className="py-2">
                    <button
                      onClick={() => { setModal("settings"); setProfileOpen(false) }}
                      className="w-full px-5 py-3 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      {t("Impostazioni account", "Account settings")}
                    </button>
                    <button
                      onClick={() => { setModal("plans"); setProfileOpen(false) }}
                      className="w-full px-5 py-3 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      {t("Piani", "Plans")}
                    </button>
                  </div>

                  <div className="border-t border-white/5 py-2">
                    <button
                      onClick={onLogout}
                      className="w-full px-5 py-3 text-left text-sm text-white/30 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("Esci", "Log out")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 flex flex-col p-6 fixed h-full pt-10">
          <div className="border-t border-white/5 pt-8">
            <p className="text-white/20 text-xs uppercase tracking-widest mb-4">
              {t("Registra", "Record")}
            </p>
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-full py-3 rounded-full text-sm font-semibold transition-all mb-4 ${
                recording
                  ? "bg-white/10 text-white border border-white/20 animate-pulse"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {recording ? "⏹ Stop" : "🎙 " + t("Registra", "Record")}
            </button>

            <select
              value={outputType}
              disabled
              className="w-full bg-transparent border border-white/10 text-white/60 rounded-full px-4 py-2 text-sm outline-none"
            >
              <option value="ppt" className="bg-[#0a0a0a]">PowerPoint</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="ml-64 flex-1 p-10">
          <div className="max-w-3xl">
            <div className="border-b border-white/5 pb-8 mb-10">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Dashboard</p>
              <h1 className="text-3xl font-bold">{t("Genera un documento", "Generate a document")}</h1>
            </div>

            <div className="mb-8">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">
                {t("Trascrizione o prompt", "Transcription or prompt")}
              </p>
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder={t(
                  "La trascrizione apparirà qui dopo la registrazione, oppure scrivi direttamente il tuo prompt...",
                  "Transcription will appear here after recording, or type your prompt directly..."
                )}
                className="w-full bg-transparent border border-white/10 text-white rounded-2xl p-5 outline-none resize-none h-36 placeholder-white/20 text-sm leading-relaxed focus:border-white/20 transition-all"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading || !transcription}
              className="bg-white text-black font-semibold px-7 py-3 rounded-full text-sm hover:bg-white/90 disabled:opacity-30 transition-all"
            >
              {loading
                ? t("Generazione in corso...", "Generating...")
                : t("Genera PowerPoint", "Generate PowerPoint")}
            </button>

            {conversions.length > 0 && (
              <div className="mt-16">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-6">
                  {t("Conversioni recenti", "Recent conversions")}
                </p>
                <div className="space-y-0">
                  {conversions.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between border-t border-white/5 py-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 border border-white/10 rounded-xl flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white/40" />
                        </div>
                        <div>
                          <p className="text-white text-sm">{c.title}</p>
                          <p className="text-white/30 text-xs mt-0.5">{t("PowerPoint", "PowerPoint")}</p>
                        </div>
                      </div>
                      <a href={c.url} download="voicemint.pptx">
                        <Download className="w-4 h-4 text-white/30 hover:text-white transition-all" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Impostazioni */}
      <AnimatePresence>
        {modal === "settings" && (
          <SettingsModal user={user} token={token} setUser={setUser} onClose={() => setModal(null)} lang={lang} />
        )}
        {modal === "plans" && (
          <PlansModal user={user} token={token} setUser={setUser} onClose={() => setModal(null)} lang={lang} />
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Modal Impostazioni ---
function SettingsModal({ user, token, setUser, onClose, lang }) {
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "" })
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" })
  const [msg, setMsg] = useState("")
  const [pwMsg, setPwMsg] = useState("")
  const t = (it, en) => lang === "it" ? it : en

  const saveProfile = async () => {
    try {
      await axios.put(`${API}/me/profile`, form, { headers: { Authorization: `Bearer ${token}` } })
      setUser({ ...user, ...form })
      setMsg(t("Profilo aggiornato!", "Profile updated!"))
    } catch {
      setMsg(t("Errore nel salvataggio", "Save error"))
    }
  }

  const changePassword = async () => {
    try {
      await axios.put(`${API}/me/password`, pwForm, { headers: { Authorization: `Bearer ${token}` } })
      setPwMsg(t("Password aggiornata!", "Password updated!"))
      setPwForm({ old_password: "", new_password: "" })
    } catch (err) {
      setPwMsg(err.response?.data?.detail || t("Errore", "Error"))
    }
  }

  const cancelSub = async () => {
    if (!window.confirm(t("Sei sicuro di voler annullare l'abbonamento?", "Are you sure you want to cancel?"))) return
    try {
      await axios.delete(`${API}/me/subscription`, { headers: { Authorization: `Bearer ${token}` } })
      setUser({ ...user, tier: "free", pro_until: null })
      onClose()
    } catch (err) {
      alert(err.response?.data?.detail || t("Errore", "Error"))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">{t("Impostazioni account", "Account settings")}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40 hover:text-white transition-all" /></button>
        </div>

        {/* Info account */}
        <div className="mb-6 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
          <p className="text-white/30 text-xs mb-1">Email</p>
          <p className="text-white text-sm">{user?.email}</p>
        </div>

        {/* Nome e cognome */}
        <div className="space-y-3 mb-6">
          <input
            placeholder={t("Nome", "First name")}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
          />
          <input
            placeholder={t("Cognome", "Last name")}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
          />
          <button onClick={saveProfile} className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 transition-all">
            {t("Salva profilo", "Save profile")}
          </button>
          {msg && <p className="text-green-400 text-xs text-center">{msg}</p>}
        </div>

        {/* Cambia password */}
        <div className="border-t border-white/5 pt-6 space-y-3 mb-6">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">{t("Cambia password", "Change password")}</p>
          <input
            type="password"
            placeholder={t("Password attuale", "Current password")}
            value={pwForm.old_password}
            onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
            className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
          />
          <input
            type="password"
            placeholder={t("Nuova password", "New password")}
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
            className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
          />
          <button onClick={changePassword} className="w-full bg-white/10 text-white font-semibold py-3 rounded-full text-sm hover:bg-white/20 transition-all">
            {t("Cambia password", "Change password")}
          </button>
          {pwMsg && <p className="text-green-400 text-xs text-center">{pwMsg}</p>}
        </div>

        {/* Annulla abbonamento */}
        {user?.tier === "pro" && !user?.lifetime_pro && (
          <div className="border-t border-white/5 pt-6">
            <button onClick={cancelSub} className="w-full text-red-400 text-sm hover:text-red-300 transition-all py-2">
              {t("Annulla abbonamento", "Cancel subscription")}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// --- Modal Piani ---
function PlansModal({ user, token, setUser, onClose, lang }) {
  const t = (it, en) => lang === "it" ? it : en
  const isLifetimePro = user?.lifetime_pro
  const isPro = user?.tier === "pro"

  const checkout = async () => {
    try {
      const res = await axios.post(`${API}/create-checkout-session`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      window.location.href = res.data.url
    } catch {
      alert(t("Errore nel pagamento", "Payment error"))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">{t("Piani", "Plans")}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-white/40 hover:text-white transition-all" /></button>
        </div>

        <div className="space-y-4">
          {/* Free */}
          <div className={`border rounded-2xl p-6 ${!isPro ? "border-white/30" : "border-white/10"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{t("Piano Free", "Free plan")}</p>
              {!isPro && <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{t("Attivo", "Active")}</span>}
            </div>
            <p className="text-3xl font-bold mb-4">€0</p>
            <ul className="space-y-2 text-white/40 text-sm">
              <li>✓ {t("180 crediti al mese", "180 credits/month")}</li>
              <li>✓ {t("PPT", "PPT")}</li>
              <li>✓ {t("Watermark VoiceMint", "VoiceMint watermark")}</li>
            </ul>
          </div>

          {/* Pro */}
          <div className={`border rounded-2xl p-6 ${isPro ? "border-white/30" : "border-white/10"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Pro</p>
              {isPro && (
                <span className="text-xs bg-white text-black px-3 py-1 rounded-full font-semibold">
                  {isLifetimePro ? t("Pro a vita", "Lifetime Pro") : t("Attivo", "Active")}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold mb-4">€5<span className="text-white/30 text-sm font-normal">/mese</span></p>
            <ul className="space-y-2 text-white/40 text-sm mb-6">
              <li>✓ {t("Crediti illimitati", "Unlimited credits")}</li>
              <li>✓ {t("PPT", "PPT")}</li>
              <li>✓ {t("Senza watermark", "No watermark")}</li>
              <li>✓ {t("Supporto prioritario", "Priority support")}</li>
            </ul>
            {!isPro && (
              <button
                onClick={checkout}
                className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 transition-all"
              >
                {t("Passa a Pro →", "Upgrade to Pro →")}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}