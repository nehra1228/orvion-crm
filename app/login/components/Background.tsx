export default function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* Blue Glow */}
      <div className="absolute left-[-220px] top-[-180px] h-[620px] w-[620px] rounded-full bg-blue-600/15 blur-[180px]" />

      {/* Gold Glow */}
      <div className="absolute bottom-[-220px] right-[-180px] h-[620px] w-[620px] rounded-full bg-yellow-500/15 blur-[220px]" />

      {/* Center Glow */}
      <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[260px]" />

      {/* Top Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,.10),transparent_45%)]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04]">

        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

      </div>

      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-soft-light">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".9"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>

          <rect
            width="100%"
            height="100%"
            filter="url(#noise)"
          />
        </svg>
      </div>

    </div>
  );
}