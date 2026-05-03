"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

const toneClass = {
  hot: "border-[rgba(237,73,86,0.28)] bg-[rgba(237,73,86,0.07)] text-[color:var(--hot)]",
  gold: "border-[rgba(230,183,101,0.26)] bg-[rgba(230,183,101,0.06)] text-[color:var(--gold)]",
  aqua: "border-[rgba(88,200,190,0.24)] bg-[rgba(88,200,190,0.055)] text-[color:var(--aqua)]",
  muted: "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.025)] text-[color:var(--muted-strong)]",
};

export function StudioDraftMotionCard({
  href,
  title,
  subtitle,
  statusLabel,
  tone,
  hook,
  captionPreview,
}: {
  href: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  tone: "hot" | "gold" | "aqua" | "muted";
  hook: string;
  captionPreview: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.28 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.014))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition hover:border-[rgba(237,73,86,0.3)] hover:bg-[rgba(237,73,86,0.035)]"
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(237,73,86,0.32)] to-transparent opacity-70" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--hot)]">
              {title}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[color:var(--muted)]">{subtitle}</p>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]", toneClass[tone])}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[color:var(--muted-strong)]">
          Gancho: {hook}
        </p>
        <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[color:var(--muted)]">
          Legenda: {captionPreview}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--muted)] group-hover:text-[color:var(--foreground)]">
          continuar no roteiro
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </Link>
    </motion.div>
  );
}
