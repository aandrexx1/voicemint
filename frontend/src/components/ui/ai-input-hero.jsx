"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { DeckModeModal } from "../deck-mode-modal.jsx";

const API = import.meta.env.VITE_API_URL || "https://voicemint-backend.onrender.com";

export function HeroWave({
  className,
  style,
  title = "Transform your voice into PowerPoint.",
  subtitle = "Speak freely. Voicemint generates PPT presentations and professional PDFs in seconds, powered by AI.",
  placeholder: _p = "Descrivi l'argomento del tuo studio...",
  buttonText = "Genera",
  onPromptSubmit,
}) {
  const { t, i18n } = useTranslation();
  const basePlaceholder = t("hero_animated_base");
  const suggestions = useMemo(() => {
    const arr = t("hero_suggestions", { returnObjects: true });
    return Array.isArray(arr) ? arr : [];
  }, [t, i18n.language]);

  const [prompt, setPrompt] = useState("");
  const [deckModeOpen, setDeckModeOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const suggestionsRef = useRef(suggestions);

  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState(() => basePlaceholder);
  const typingStateRef = useRef({
    suggestionIndex: 0,
    charIndex: 0,
    deleting: false,
    running: true,
  });
  const timersRef = useRef([]);

  useEffect(() => {
    typingStateRef.current = {
      suggestionIndex: 0,
      charIndex: 0,
      deleting: false,
      running: true,
    };
    setAnimatedPlaceholder(basePlaceholder);
    const typeSpeed = 70;
    const deleteSpeed = 40;
    const pauseAtEnd = 1200;
    const pauseBetween = 500;

    function schedule(fn, delay) {
      const id = window.setTimeout(fn, delay);
      timersRef.current.push(id);
    }

    function clearTimers() {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    }

    function step() {
      if (!typingStateRef.current.running) return;
      if (prompt !== "") {
        setAnimatedPlaceholder(basePlaceholder);
        schedule(step, 300);
        return;
      }

      const state = typingStateRef.current;
      const suggestions = suggestionsRef.current;
      const len = suggestions.length;
      if (!len) {
        setAnimatedPlaceholder(basePlaceholder);
        return;
      }
      const current = suggestions[state.suggestionIndex % len] || "";

      if (!state.deleting) {
        const nextIndex = state.charIndex + 1;
        const next = current.slice(0, nextIndex);
        setAnimatedPlaceholder(basePlaceholder + next);
        state.charIndex = nextIndex;
        if (nextIndex >= current.length) {
          schedule(() => {
            state.deleting = true;
            step();
          }, pauseAtEnd);
        } else {
          schedule(step, typeSpeed);
        }
      } else {
        const nextIndex = Math.max(0, state.charIndex - 1);
        const next = current.slice(0, nextIndex);
        setAnimatedPlaceholder(basePlaceholder + next);
        state.charIndex = nextIndex;
        if (nextIndex <= 0) {
          state.deleting = false;
          state.suggestionIndex = (state.suggestionIndex + 1) % suggestions.length;
          schedule(step, pauseBetween);
        } else {
          schedule(step, deleteSpeed);
        }
      }
    }

    clearTimers();
    schedule(step, 400);
    return () => {
      typingStateRef.current.running = false;
      clearTimers();
    };
  }, [prompt, basePlaceholder, i18n.language, suggestions]);

  const toggleRecording = async () => {
    if (recording) {
      try {
        recorderRef.current?.stop?.();
      } catch {}
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          const res = await axios.post(`${API}/upload-audio`, formData);
          setPrompt(res.data.transcription || "");
        } catch {
          // ignore
        } finally {
          try {
            stream.getTracks().forEach((t) => t.stop());
          } catch {}
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      // ignore (permissions)
    }
  };

  return (
    <section
      className={["isolate overflow-hidden bg-transparent", className].filter(Boolean).join(" ")}
      style={{ position: "relative", width: "100%", minHeight: "100vh", ...style }}
      aria-label="Hero"
    >
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 pt-28 pb-16 sm:px-8">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-zinc-300 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:mt-4 sm:text-base">
            {subtitle}
          </p>
          <form
            className="mt-6 flex items-center justify-center sm:mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              const text = (prompt || "").trim();
              if (!text) return;
              setDeckModeOpen(true);
            }}
          >
            <div className="relative w-full sm:w-[720px]">
              <div className="relative rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-black/20 p-[2px] shadow-[0_1px_2px_0_rgba(0,0,0,0.06)]">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={animatedPlaceholder}
                  rows={5}
                  className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-[rgba(15,15,20,0.55)] px-4 py-4 pr-16 text-white outline-none backdrop-blur-md placeholder:text-white/40 focus:border-[#1f3dbc]/40 focus:ring-2 focus:ring-[#1f3dbc]/40 sm:h-36"
                />
              </div>
              <button
                type="submit"
                aria-label={buttonText}
                className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f2ff] text-black transition-colors hover:bg-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </button>

              <button
                type="button"
                onClick={toggleRecording}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className={`absolute bottom-3 right-14 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 backdrop-blur-md transition-colors ${
                  recording ? "bg-red-500/20 text-red-100 hover:bg-red-500/25" : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {recording ? "■" : "🎙"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <DeckModeModal
        open={deckModeOpen}
        onClose={() => setDeckModeOpen(false)}
        onSelect={(deckMode) => {
          setDeckModeOpen(false);
          onPromptSubmit?.(prompt, deckMode);
        }}
      />
    </section>
  );
}
