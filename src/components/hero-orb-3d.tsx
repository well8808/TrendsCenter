"use client";

import { motion } from "motion/react";

interface HeroOrb3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function HeroOrb3D({ className, size = "lg" }: HeroOrb3DProps) {
  const d = size === "lg" ? 260 : size === "md" ? 200 : 158;
  const persp = Math.round(d * 1.65);
  const r = Math.round(d * 0.065);

  return (
    <>
      <style>{`
        @keyframes _g_rot {
          from { transform: rotateX(-14deg) rotateY(0deg); }
          to   { transform: rotateX(-14deg) rotateY(360deg); }
        }
        @keyframes _g_core {
          0%,100% { transform: translate(-50%,-50%) scale(1);   opacity: 0.88; }
          50%      { transform: translate(-50%,-50%) scale(1.5); opacity: 1; }
        }
        @keyframes _g_haze {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 0.95; }
        }
        ._g_body { animation: _g_rot 24s linear infinite; transform-style: preserve-3d; }
        ._g_core { animation: _g_core 3s ease-in-out infinite; }
        ._g_haze { animation: _g_haze 3.6s ease-in-out infinite; }
      `}</style>

      {/*
        Outer div: receives className (absolute/relative positioning from parent),
        sets up CSS perspective. No position style here — let className control it.
      */}
      <div
        aria-hidden="true"
        className={`pointer-events-none${className ? ` ${className}` : ""}`}
        style={{ perspective: persp, width: d, height: d }}
      >
        {/* Inner motion.div: entrance animation only — no transform-style conflict */}
        <motion.div
          style={{ width: "100%", height: "100%", position: "relative" }}
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          {/* Atmospheric haze — flat, breathes */}
          <div
            className="_g_haze"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 46%, rgba(169,140,255,0.11) 0%, rgba(64,224,208,0.05) 44%, transparent 68%)`,
            }}
          />

          {/* Globe body — rotates as unified 3-D structure */}
          <div
            className="_g_body"
            style={{ position: "absolute", inset: 0 }}
          >
            {/* Equatorial ring — aqua */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              border: "1.5px solid rgba(64,224,208,0.52)",
              boxShadow: "0 0 10px rgba(64,224,208,0.22)",
              transform: "rotateX(90deg)",
            }} />

            {/* Meridian 0° — violet */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              border: "1px solid rgba(169,140,255,0.34)",
              transform: "rotateY(0deg)",
            }} />

            {/* Meridian 60° — violet dim */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              border: "1px solid rgba(169,140,255,0.20)",
              transform: "rotateY(60deg)",
            }} />

            {/* Meridian 120° — violet very dim */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              border: "1px solid rgba(169,140,255,0.12)",
              transform: "rotateY(120deg)",
            }} />

            {/* Tropic — dashed, smaller */}
            <div style={{
              position: "absolute",
              inset: Math.round(d * 0.2),
              borderRadius: "50%",
              border: "1px dashed rgba(169,140,255,0.10)",
              transform: "rotateX(90deg)",
            }} />

            {/* Signal dot — acid, equator 40° */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              transform: "rotateX(90deg) rotateZ(40deg)",
            }}>
              <div style={{
                position: "absolute", borderRadius: "50%",
                width: 7, height: 7, top: -3.5, left: "calc(50% - 3.5px)",
                background: "#c7ff5d",
                boxShadow: "0 0 12px 4px rgba(199,255,93,0.88)",
              }} />
            </div>

            {/* Signal dot — aqua, equator 220° */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              transform: "rotateX(90deg) rotateZ(220deg)",
            }}>
              <div style={{
                position: "absolute", borderRadius: "50%",
                width: 5, height: 5, top: -2.5, left: "calc(50% - 2.5px)",
                background: "#40e0d0",
                boxShadow: "0 0 9px 3px rgba(64,224,208,0.82)",
              }} />
            </div>

            {/* Signal dot — gold, off-equator */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              transform: "rotateX(58deg) rotateZ(155deg)",
            }}>
              <div style={{
                position: "absolute", borderRadius: "50%",
                width: 5, height: 5, top: -2.5, left: "calc(50% - 2.5px)",
                background: "#f3c969",
                boxShadow: "0 0 8px 2px rgba(243,201,105,0.78)",
              }} />
            </div>

            {/* Signal dot — violet, south hemisphere */}
            <div style={{
              position: "absolute", inset: r, borderRadius: "50%",
              transform: "rotateX(110deg) rotateZ(310deg)",
            }}>
              <div style={{
                position: "absolute", borderRadius: "50%",
                width: 4, height: 4, top: -2, left: "calc(50% - 2px)",
                background: "#a98cff",
                boxShadow: "0 0 6px 1.5px rgba(169,140,255,0.7)",
              }} />
            </div>

            {/* Core */}
            <div className="_g_core" style={{
              position: "absolute",
              width: Math.round(d * 0.095),
              height: Math.round(d * 0.095),
              top: "50%", left: "50%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(199,255,93,0.9) 0%, rgba(169,140,255,0.5) 55%, transparent 100%)",
              boxShadow: "0 0 18px 5px rgba(169,140,255,0.45)",
            }} />
          </div>
        </motion.div>
      </div>
    </>
  );
}
