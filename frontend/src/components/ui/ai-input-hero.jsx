"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navbar } from "./mini-navbar";

export function HeroWave({
  className,
  style,
  title = "Transform your voice into PowerPoint.",
  subtitle = "Speak freely. Voicemint generates PPT presentations and professional PDFs in seconds, powered by AI.",
  placeholder: _p = "Descrivi l'argomento del tuo studio...",
  buttonText = "Genera",
  onPromptSubmit,
  onLogin,
  onGetStarted,
}) {
  const [prompt, setPrompt] = useState("");

  const basePlaceholder = "Riassumi ";
  const suggestionsRef = useRef([
    " l'esame di diritto privato",
    " il capitolo di anatomia",
    " gli appunti di marketing",
    " la lezione di storia medievale",
    " l'introduzione alla fisica quantistica",
    " il ripasso di letteratura",
  ]);

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState(basePlaceholder);
  const typingStateRef = useRef({
    suggestionIndex: 0,
    charIndex: 0,
    deleting: false,
    running: true,
  });
  const timersRef = useRef([]);

  useEffect(() => {
    typingStateRef.current.running = true;
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
      const current = suggestions[state.suggestionIndex % suggestions.length] || "";

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
  }, [prompt]);

  return (
    <section
      className={["isolate overflow-hidden bg-transparent", className].filter(Boolean).join(" ")}
      style={{ position: "relative", width: "100%", minHeight: "100vh", ...style }}
      aria-label="Hero"
    >
      <Navbar onLogin={onLogin} onSignup={onGetStarted} />

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
              onPromptSubmit?.(prompt);
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
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
