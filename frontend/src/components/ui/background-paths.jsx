import { useId } from "react"

/**
 * Background decorativo con linee/percorsi.
 * - `fixed` così continua anche quando scrolli in basso
 * - `pointer-events-none` così non blocca click sui contenuti
 */
export function BackgroundPaths({ title = "Background Paths" }) {
  const id = useId()

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Sfondo sfumato */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.10),transparent_55%)]" />

      {/* Linee SVG "infinita" */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#00D4FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.0" />
          </linearGradient>
          <filter id={`blur-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {/* Percorsi principali */}
        <g fill="none" stroke={`url(#grad-${id})`} strokeWidth="2">
          <path d="M-40 740 C 120 620, 220 660, 360 520 S 660 260, 820 300 S 1120 520, 1470 320" />
          <path d="M-40 600 C 120 520, 240 560, 360 470 S 630 310, 820 340 S 1100 520, 1470 260" />
          <path d="M-40 460 C 160 390, 260 440, 390 360 S 640 220, 830 250 S 1110 420, 1470 210" />
          <path d="M-40 330 C 140 290, 260 320, 410 260 S 670 160, 860 190 S 1110 290, 1470 140" />
        </g>

        {/* Linee tratteggiate */}
        <g
          fill="none"
          stroke="#00D4FF"
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="6 10"
          filter={`url(#blur-${id})`}
        >
          <path d="M-60 820 C 120 760, 260 780, 410 720 S 700 610, 860 650 S 1140 780, 1490 640" />
          <path d="M-60 250 C 140 220, 260 240, 420 200 S 720 120, 900 160 S 1180 260, 1490 160" />
          <path d="M220 -40 C 260 120, 350 190, 460 230 S 720 320, 780 420 S 920 690, 1160 930" />
        </g>
      </svg>

      {/* Overlay molto leggero per mantenere leggibilità */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#070707] opacity-80" />
    </div>
  )
}

