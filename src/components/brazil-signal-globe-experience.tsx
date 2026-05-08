"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function BrazilSignalGlobeExperience({ className }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(239,233,220,0.14)] bg-[#020408] shadow-[0_28px_90px_rgba(0,0,0,0.46)]",
        className,
      )}
      aria-label="Mapa vivo de Reels com foco no Brasil"
    >
      <div
        aria-hidden={loaded}
        className={cn(
          "absolute inset-0 z-10 grid place-items-center bg-[radial-gradient(circle_at_42%_38%,rgba(64,224,208,0.14),transparent_28rem),linear-gradient(135deg,#01030a,#020714_52%,#000)] transition-opacity duration-500",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="grid place-items-center gap-3 text-center">
          <div className="brand-mark grid h-12 w-12 place-items-center rounded-[var(--radius-md)] text-white shadow-[0_16px_44px_rgba(237,73,86,0.28)]">
            <span className="sr-only">Trends Center</span>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17V7" />
              <path d="M9 19V5" />
              <path d="M13 15V9" />
              <path d="M17 20V4" />
              <path d="M21 14V10" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Trends Center</p>
            <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              carregando mapa vivo
            </p>
          </div>
        </div>
      </div>
      <iframe
        className={cn(
          "block w-full border-0 bg-[#020408] transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={{ height: "min(780px, calc(100dvh - 42px))", minHeight: 720 }}
        title="Mapa vivo de Reels com foco no Brasil"
        src="/signal-globe/index.html"
        loading="eager"
        onLoad={() => setLoaded(true)}
      />
    </section>
  );
}
