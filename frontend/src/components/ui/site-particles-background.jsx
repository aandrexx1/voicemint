"use client";

import { Particles } from "@/components/ui/particles";

/**
 * Sfondo globale: particelle che reagiscono al cursore (stesso stile login/auth).
 * Usare una sola volta in App, con contenuto a z-10 sopra.
 */
export function SiteParticlesBackground({ color = "#666666", quantity = 120, ease = 20 }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute inset-0 isolate contain-strict">
        <div className="absolute top-0 left-0 h-[320px] w-[140px] -translate-y-[35%] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.06)_0,hsla(0,0%,55%,0.02)_50%,rgba(255,255,255,0.02)_80%)]" />
        <div className="absolute top-0 left-0 h-[320px] w-[60px] translate-x-[5%] -translate-y-1/2 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)]" />
        <div className="absolute top-0 left-0 h-[320px] w-[60px] -translate-y-[35%] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)]" />
      </div>
      <Particles color={color} quantity={quantity} ease={ease} className="absolute inset-0" />
    </div>
  );
}
