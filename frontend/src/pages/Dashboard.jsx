import { useState } from "react"
import { Mic, FileText, Layout, Download, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import axios from "axios"

const API = "http://127.0.0.1:8000"

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
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        }
      )
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = `voicemint.${outputType}`
      a.click()

      setConversions(prev => [{
        title: transcription.slice(0, 40) + "...",
        type: outputType,
        url
      }, ...prev])
    } catch {
      alert("Errore nella generazione — controlla il credito OpenAI")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex">
      {/* Sidebar */}
      <div className="w-72 bg-[#1a1a2e] p-6 flex flex-col gap-6 fixed h-full">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-2 rounded-xl">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">VoiceMint</span>
        </div>

        <div className="text-gray-400 text-sm">
          <p>👤 {user?.username}</p>
          <p className="mt-1">
            {user?.tier === "free"
              ? "🆓 Piano Free"
              : "⭐ Piano Pro"}
          </p>
        </div>

        {/* Registrazione */}
        <div className="bg-[#0f0f1a] rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-white font-semibold text-sm">Quick Record</p>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              recording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-violet-600 hover:bg-violet-700"
            } text-white`}
          >
            {recording ? "⏹ Stop" : "🎙 Registra"}
          </button>

          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            className="bg-[#1a1a2e] text-white rounded-xl px-3 py-2 outline-none"
          >
            <option value="pdf">PDF</option>
            <option value="ppt">PowerPoint</option>
            <option value="html">Sito Web</option>
          </select>
        </div>

        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-2 text-gray-500 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      {/* Main */}
      <div className="ml-72 flex-1 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

        {/* Trascrizione */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 mb-6">
          <p className="text-violet-400 font-semibold mb-3">Trascrizione</p>
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="La trascrizione apparirà qui dopo la registrazione, oppure scrivi direttamente..."
            className="w-full bg-[#0f0f1a] text-white rounded-xl p-4 outline-none resize-none h-32 placeholder-gray-600"
          />
          <button
            onClick={generate}
            disabled={loading || !transcription}
            className="mt-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            {loading ? "Generazione..." : `Genera ${outputType.toUpperCase()}`}
          </button>
        </div>

        {/* Conversioni */}
        {conversions.length > 0 && (
          <div>
            <p className="text-white font-bold mb-4">Conversioni recenti</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversions.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1a1a2e] rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{c.title}</p>
                    <p className="text-violet-400 text-xs mt-1">{c.type.toUpperCase()}</p>
                  </div>
                  <a href={c.url} download={`voicemint.${c.type}`}>
                    <Download className="w-5 h-5 text-violet-400 hover:text-white transition-all" />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}