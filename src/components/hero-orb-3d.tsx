"use client";

import { motion } from "motion/react";

const STATIC_DOTS = [
  { x: 28, y: 38, acid: true },
  { x: 68, y: 22, acid: false },
  { x: 52, y: 62, acid: true },
  { x: 18, y: 58, acid: false },
  { x: 76, y: 72, acid: true },
  { x: 42, y: 18, acid: false },
  { x: 82, y: 44, acid: true },
];

export function HeroOrb3D({ className }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes orb-spin-1 {
          from { transform: rotateX(72deg) rotateZ(0deg); }
          to   { transform: rotateX(72deg) rotateZ(360deg); }
        }
        @keyframes orb-spin-2 {
          from { transform: rotateY(72deg) rotateZ(0deg); }
          to   { transform: rotateY(72deg) rotateZ(360deg); }
        }
        @keyframes orb-spin-3 {
          from { transform: rotateX(40deg) rotateY(55deg) rotateZ(0deg); }
          to   { transform: rotateX(40deg) rotateY(55deg) rotateZ(360deg); }
        }
        @keyframes orb-core-pulse {
          0%,100% { box-shadow: 0 0 14px 4px rgba(199,255,93,0.55); transform: translate(-50%,-50%) scale(1); }
          50%      { box-shadow: 0 0 28px 10px rgba(199,255,93,0.22); transform: translate(-50%,-50%) scale(1.35); }
        }
        @keyframes orb-haze-breathe {
          0%,100% { opacity: 0.12; }
          50%      { opacity: 0.22; }
        }
        .orb-r1        { animation: orb-spin-1  7s  linear ease-in-out infinite; }
        .orb-r2        { animation: orb-spin-2  11s linear ease-in-out infinite reverse; }
        .orb-r3        { animation: orb-spin-3  17s linear ease-in-out infinite; }
        .orb-core      { animation: orb-core-pulse 2.6s ease-in-out infinite; }
        .orb-haze      { animation: orb-haze-breathe 3.2s ease-in-out infinite; }
      `}</style>

      <motion.div
        aria-hidden="true"
        className={className}
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        style={{ perspective: "720px", width: 288, height: 288, flexShrink: 0 }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            position: "relative",
            width: "100%",
            height: "100%",
            transform: "rotateY(-8deg) rotateX(4deg)",
          }}
        >
          {/* Ambient haze at centre */}
          <div
            className="orb-haze absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 200,
              height: 200,
              background:
                "radial-gradient(circle, rgba(199,255,93,0.14) 0%, rgba(64,224,208,0.05) 40%, transparent 70%)",
            }}
          />

          {/* Equator reference — very subtle horizontal line */}
          <div
            className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2"
            style={{
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(199,255,93,0.18) 30%, rgba(199,255,93,0.18) 70%, transparent)",
            }}
          />

          {/* ── Ring 1 — outer, acid ─────────────────────────────────── */}
          <div
            className="orb-r1 absolute rounded-full"
            style={{
              inset: 8,
              border: "1.5px solid rgba(199,255,93,0.52)",
              boxShadow: "0 0 12px rgba(199,255,93,0.16)",
            }}
          >
            {/* Orbiting signal dot */}
            <div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                top: -4,
                left: "calc(50% - 4px)",
                background: "#c7ff5d",
                boxShadow: "0 0 12px 3px rgba(199,255,93,0.85)",
              }}
            />
          </div>

          {/* ── Ring 2 — middle, aqua ────────────────────────────────── */}
          <div
            className="orb-r2 absolute rounded-full"
            style={{
              inset: 48,
              border: "1px solid rgba(64,224,208,0.46)",
              boxShadow: "0 0 8px rgba(64,224,208,0.13)",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: 6,
                height: 6,
                top: -3,
                left: "calc(50% - 3px)",
                background: "#40e0d0",
                boxShadow: "0 0 9px 2px rgba(64,224,208,0.8)",
              }}
            />
          </div>

          {/* ── Ring 3 — inner, gold dashed ──────────────────────────── */}
          <div
            className="orb-r3 absolute rounded-full"
            style={{
              inset: 84,
              border: "1px dashed rgba(243,201,105,0.38)",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: 5,
                height: 5,
                top: -2.5,
                left: "calc(50% - 2.5px)",
                background: "#f3c969",
                boxShadow: "0 0 7px 1.5px rgba(243,201,105,0.75)",
              }}
            />
          </div>

          {/* ── Core glow ─────────────────────────────────────────────── */}
          <div
            className="orb-core absolute rounded-full"
            style={{
              width: 12,
              height: 12,
              top: "50%",
              left: "50%",
              background: "#c7ff5d",
            }}
          />

          {/* ── Static micro-signal dots ──────────────────────────────── */}
          {STATIC_DOTS.map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                background: dot.acid
                  ? "rgba(199,255,93,0.35)"
                  : "rgba(64,224,208,0.28)",
              }}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}
