"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  baseSize: number;
}

const COLORS = [
  "rgba(157,131,236,", // violet
  "rgba(88,200,190,",  // aqua
  "rgba(237,73,86,",   // hot
  "rgba(230,183,101,", // gold
];

const FOV = 320;

function project(x: number, y: number, z: number, cx: number, cy: number) {
  const scale = FOV / (z + FOV);
  return {
    px: x * scale + cx,
    py: y * scale + cy,
    scale,
  };
}

function makeParticle(w: number, h: number): Particle {
  const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: (Math.random() - 0.5) * w * 1.2,
    y: (Math.random() - 0.5) * h * 1.2,
    z: (Math.random() - 0.5) * 400,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.14,
    vz: (Math.random() - 0.5) * 0.22,
    color: colorBase,
    baseSize: 1.2 + Math.random() * 2.0,
  };
}

interface ParticleFieldProps {
  className?: string;
  count?: number;
  opacity?: number;
}

export function ParticleField({ className, count = 64, opacity = 0.38 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      // Re-seed if particles are way out of bounds
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: count }, () => makeParticle(w, h));
      }
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const particles = particlesRef.current;

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Soft bounce at boundaries
        const hw = w * 0.65;
        const hh = h * 0.65;
        if (p.x > hw || p.x < -hw) p.vx *= -1;
        if (p.y > hh || p.y < -hh) p.vy *= -1;
        if (p.z > 200 || p.z < -200) p.vz *= -1;
      }

      // Project all particles
      const projected = particles.map((p) => ({
        ...project(p.x, p.y, p.z, cx, cy),
        color: p.color,
        size: p.baseSize * (FOV / (p.z + FOV)),
        alpha: Math.max(0.05, Math.min(0.9, (FOV - Math.abs(p.z)) / FOV)),
      }));

      // Draw connections
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.px - b.px;
          const dy = a.py - b.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;
          if (dist < maxDist) {
            const lineAlpha = ((1 - dist / maxDist) * 0.18 * Math.min(a.alpha, b.alpha));
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.strokeStyle = `rgba(157,131,236,${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of projected) {
        const r = Math.max(0.5, p.size);
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${(p.alpha * 0.85).toFixed(3)})`;
        ctx.shadowBlur = r * 4;
        ctx.shadowColor = `${p.color}0.6)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none${className ? ` ${className}` : ""}`}
      style={{ opacity, position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
    />
  );
}
