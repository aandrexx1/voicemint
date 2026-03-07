import { useState } from "react"
import { Mic, Download, LogOut, FileText, Globe } from "lucide-react"
import { motion } from "framer-motion"
import axios from "axios"

const API = "https://voicemint-production.up.railway.app"

export default function Dashboard({ token, user, onLogout }) {
  const [recording, setRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [outputType, setOutputType] = useState("pdf")
  const [loading, setLoading] = useState(false)
  const [conversions, setConversions] = useState([])
  const [mediaRecorder, setMediaRecorder] = useState(null)

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
        setTranscription("Errore nella trascrizione — controlla il credito OpenAI")
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
      a.download = `voicemint.${outputType}`
      a.click()
      setConversions(prev => [{ title: transcription.slice(0, 50) + "...", type: outputType, url }, ...prev])
    } catch {
      alert("Errore nella generazione — controlla il credito OpenAI")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-2 mb-10">
          <Mic className="w-4 h-4 text-white" />
          <span className="font-semibold text-sm tracking-tight">VoiceMint</span>
        </div>

        <div className="mb-8">
          <p className="text-white/20 text-xs uppercase tracking-widest mb-4">Account</p>
          <p className="text-white text-sm">{user?.username}</p>
          <p className="text-white/30 text-xs mt-1">{user?.tier === "free" ? "Piano Free" : "Piano Pro"}</p>
        </div>

        {/* Quick Record */}
        <div className="border-t border-white/5 pt-8">
          <p className="text-white/20 text-xs uppercase tracking-widest mb-4">Quick Record</p>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full py-3 rounded-full text-sm font-semibold transition-all mb-4 ${
              recording
                ? "bg-white/10 text-white border border-white/20 animate-pulse"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {recording ? "⏹ Stop registrazione" : "🎙 Registra"}
          </button>

          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            className="w-full bg-transparent border border-white/10 text-white/60 rounded-full px-4 py-2 text-sm outline-none"
          >
            <option value="pdf" className="bg-[#0a0a0a]">PDF</option>
            <option value="ppt" className="bg-[#0a0a0a]">PowerPoint</option>
            <option value="html" className="bg-[#0a0a0a]">Sito Web</option>
          </select>
        </div>

        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-2 text-white/20 hover:text-white/60 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Main */}
      <div className="ml-64 flex-1 p-10">
        <div className="max-w-3xl">
          <div className="border-b border-white/5 pb-8 mb-10">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Dashboard</p>
            <h1 className="text-3xl font-bold">Genera un documento</h1>
          </div>

          {/* Trascrizione */}
          <div className="mb-8">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Trascrizione</p>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="La trascrizione apparirà qui dopo la registrazione, oppure scrivi direttamente..."
              className="w-full bg-transparent border border-white/10 text-white rounded-2xl p-5 outline-none resize-none h-36 placeholder-white/20 text-sm leading-relaxed focus:border-white/20 transition-all"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !transcription}
            className="bg-white text-black font-semibold px-7 py-3 rounded-full text-sm hover:bg-white/90 disabled:opacity-30 transition-all"
          >
            {loading ? "Generazione in corso..." : `Genera ${outputType.toUpperCase()}`}
          </button>

          {/* Conversioni */}
          {conversions.length > 0 && (
            <div className="mt-16">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-6">Conversioni recenti</p>
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
                        {c.type === "html" ? <Globe className="w-4 h-4 text-white/40" /> : <FileText className="w-4 h-4 text-white/40" />}
                      </div>
                      <div>
                        <p className="text-white text-sm">{c.title}</p>
                        <p className="text-white/30 text-xs mt-0.5">{c.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <a href={c.url} download={`voicemint.${c.type}`}>
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
  )
}