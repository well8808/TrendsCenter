"use client";

import { motion } from "motion/react";

interface HeroOrb3DProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function HeroOrb3D({ className, size = "lg" }: HeroOrb3DProps) {
  const d = size === "lg" ? 260 : size === "md" ? 200 : 158;
  const persp = Math.round(d * 1.65);

  // Ring inset — gives the rings a margin from the container edge
  const rMain = Math.round(d * 0.065);
  // Tropic ring inset — smaller circle, inset more
  const rTropic = Math.round(d * 0.20);

  // Signal dot geometry helper
  const dot = (sz: number) => ({
    width: sz,
    height: sz,
    top: -(sz / 2),
    left: `calc(50% - ${sz / 2}px)`,
  });

  // Core size
  const coreSize = Math.round(d * 0.13);

  return (
    <>
      <style>{`
        @keyframes _g_rot {
          from { transform: rotateX(-18deg) rotateY(0deg); }
          to   { transform: rotateX(-18deg) rotateY(360deg); }
        }
        @keyframes _g_core {
          0%,100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.92;
            box-shadow: 0 0 22px 7px rgba(169,140,255,0.55), 0 0 44px 14px rgba(237,73,86,0.22), 0 0 60px 20px rgba(199,255,93,0.12);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.7);
            opacity: 1;
            box-shadow: 0 0 34px 12px rgba(169,140,255,0.75), 0 0 60px 20px rgba(237,73,86,0.32), 0 0 80px 28px rgba(199,255,93,0.18);
          }
        }
        @keyframes _g_haze {
          0%,100% { opacity: 0.72; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.06); }
        }
        @keyframes _g_haze_outer {
          0%,100% { opacity: 0.38; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.10); }
        }
        ._g_body {
          animation: _g_rot 24s linear infinite;
          transform-style: preserve-3d;
          position: absolute;
          inset: 0;
        }
        ._g_core {
          animation: _g_core 3s ease-in-out infinite;
          position: absolute;
          border-radius: 50%;
        }
        ._g_haze {
          animation: _g_haze 3.6s ease-in-out infinite;
        }
        ._g_haze_outer {
          animation: _g_haze_outer 4.8s ease-in-out infinite;
        }
      `}</style>

      {/*
        REGRA CRÍTICA: O outer div NÃO tem position inline.
        Apenas className controla o posicionamento externo.
        perspective fica aqui como container de perspectiva CSS 3D.
      */}
      <div
        aria-hidden="true"
        className={`pointer-events-none${className ? ` ${className}` : ""}`}
        style={{ perspective: persp, width: d, height: d }}
      >
        {/*
          Inner motion.div: responsável apenas pela animação de entrada.
          position: relative aqui NÃO conflita com o className do outer div
          pois está em um elemento filho separado.
        */}
        <motion.div
          style={{ width: "100%", height: "100%", position: "relative" }}
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          {/* Outer atmospheric haze */}
          <div
            className="_g_haze_outer"
            style={{
              position: "absolute",
              inset: -Math.round(d * 0.16),
              borderRadius: "50%",
              background: `radial-gradient(circle at 50% 50%, rgba(237,73,86,0.10) 0%, rgba(169,140,255,0.08) 35%, rgba(64,224,208,0.05) 60%, transparent 75%)`,
              pointerEvents: "none",
            }}
          />

          {/* Inner atmospheric haze */}
          <div
            className="_g_haze"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle at 44% 40%, rgba(237,73,86,0.18) 0%, rgba(169,140,255,0.16) 35%, rgba(88,200,190,0.08) 55%, transparent 72%)`,
              pointerEvents: "none",
            }}
          />

          {/*
            Globe body — este container GIRA.
            Contém todos os anéis e dots como filhos estáticos.
            A rotação do container cria a ilusão de planeta girando.
            transform-style: preserve-3d é definido na classe _g_body.
          */}
          <div className="_g_body">

            {/* === ANÉIS EQUATORIAIS === */}

            {/* Equador principal — aqua vibrante */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              border: "1.5px solid rgba(88,200,190,0.78)",
              boxShadow: "0 0 18px rgba(88,200,190,0.40), inset 0 0 12px rgba(88,200,190,0.14)",
              transform: "rotateX(90deg)",
            }} />

            {/* === MERIDIANOS === */}

            {/* Meridiano 0deg — IG gradient hot */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              border: "1.5px solid rgba(225,48,108,0.52)",
              boxShadow: "0 0 14px rgba(225,48,108,0.22)",
              transform: "rotateY(0deg)",
            }} />

            {/* Meridiano 60deg — violet médio */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              border: "1px solid rgba(157,131,236,0.38)",
              boxShadow: "0 0 8px rgba(157,131,236,0.12)",
              transform: "rotateY(60deg)",
            }} />

            {/* Meridiano 120deg — violet sutil */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              border: "1px solid rgba(157,131,236,0.22)",
              transform: "rotateY(120deg)",
            }} />

            {/* Meridiano 150deg — violet dim */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              border: "1px solid rgba(157,131,236,0.12)",
              transform: "rotateY(150deg)",
            }} />

            {/* === TRÓPICOS === */}

            {/* Linha de trópico — gold */}
            <div style={{
              position: "absolute",
              inset: rTropic,
              borderRadius: "50%",
              border: "1px dashed rgba(230,183,101,0.28)",
              boxShadow: "0 0 6px rgba(230,183,101,0.12)",
              transform: "rotateX(90deg)",
            }} />

            {/* Paralelo sul — dashed violet */}
            <div style={{
              position: "absolute",
              inset: Math.round(d * 0.27),
              borderRadius: "50%",
              border: "1px dashed rgba(157,131,236,0.14)",
              transform: "rotateX(90deg)",
            }} />

            {/* === SIGNAL DOTS === */}

            {/*
              Como os dots funcionam (REGRA 4):
              O container do dot tem rotateX(90deg) + rotateZ(angle) aplicado ao anel do equador.
              O dot filho com top: -(sz/2) fica na borda do anel.
              À medida que rotateZ anima junto com o globo (via _g_body),
              o dot orbita a elipse do equador — exatamente como um ponto no planeta.
            */}

            {/* Dot hot — equador, posição 40deg */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              transform: "rotateX(90deg) rotateZ(40deg)",
            }}>
              <div style={{
                position: "absolute",
                borderRadius: "50%",
                ...dot(8),
                background: "#ed4956",
                boxShadow: "0 0 18px 6px rgba(237,73,86,0.95), 0 0 36px 10px rgba(237,73,86,0.45)",
              }} />
            </div>

            {/* Dot acid — equador, posição 140deg */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              transform: "rotateX(90deg) rotateZ(140deg)",
            }}>
              <div style={{
                position: "absolute",
                borderRadius: "50%",
                ...dot(7),
                background: "#c7ff5d",
                boxShadow: "0 0 16px 5px rgba(199,255,93,0.9), 0 0 32px 9px rgba(199,255,93,0.4)",
              }} />
            </div>

            {/* Dot aqua — equador, posição 220deg */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              transform: "rotateX(90deg) rotateZ(220deg)",
            }}>
              <div style={{
                position: "absolute",
                borderRadius: "50%",
                ...dot(6),
                background: "#58c8be",
                boxShadow: "0 0 14px 4px rgba(88,200,190,0.9), 0 0 26px 8px rgba(88,200,190,0.40)",
              }} />
            </div>

            {/* Dot gold — hemisferio norte, 155deg */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              transform: "rotateX(58deg) rotateZ(155deg)",
            }}>
              <div style={{
                position: "absolute",
                borderRadius: "50%",
                ...dot(6),
                background: "#e6b765",
                boxShadow: "0 0 12px 4px rgba(230,183,101,0.85), 0 0 24px 7px rgba(230,183,101,0.35)",
              }} />
            </div>

            {/* Dot violet — hemisferio sul, 310deg */}
            <div style={{
              position: "absolute",
              inset: rMain,
              borderRadius: "50%",
              transform: "rotateX(110deg) rotateZ(310deg)",
            }}>
              <div style={{
                position: "absolute",
                borderRadius: "50%",
                ...dot(5),
                background: "#9d83ec",
                boxShadow: "0 0 10px 3px rgba(157,131,236,0.82), 0 0 20px 6px rgba(157,131,236,0.32)",
              }} />
            </div>

            {/* === CORE === */}

            {/*
              Core pulsante — centro do globo.
              translate(-50%,-50%) é parte da animação _g_core.
              top/left 50% posiciona no centro do container.
            */}
            <div
              className="_g_core"
              style={{
                width: coreSize,
                height: coreSize,
                top: "50%",
                left: "50%",
                background: "radial-gradient(circle at 38% 38%, rgba(237,73,86,0.95) 0%, rgba(157,131,236,0.75) 40%, rgba(88,200,190,0.45) 70%, transparent 100%)",
              }}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}
