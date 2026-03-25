/**
 * Sfondo grana (film grain) come nella hero — senza onda WebGL.
 * Usare fixed inset-0 dietro al contenuto (z-0), contenuto con z-10.
 */
export function GrainBackdrop({ className = "" }) {
  const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 bg-[#050508] ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: grainSvg }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/80 via-transparent to-[#050508]/90" />
    </div>
  )
}
