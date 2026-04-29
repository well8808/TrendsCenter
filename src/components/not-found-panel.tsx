"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Compass } from "lucide-react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export interface NotFoundPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  className?: string;
}

export function NotFoundPanel({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  className,
}: NotFoundPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease }}
      className={cn(
        "app-panel relative overflow-hidden rounded-[var(--radius-lg)] p-6 md:p-8",
        className,
      )}
    >
      <div className="premium-grid pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[color:var(--line-strong)] bg-[rgba(64,224,208,0.08)]">
          <Compass className="h-5 w-5 text-[color:var(--aqua)]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[color:var(--aqua)]">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
            {description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(237, 73, 86,0.42)] bg-[rgba(237, 73, 86,0.14)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--acid)] transition hover:bg-[rgba(237, 73, 86,0.2)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--line-strong)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.38)] hover:text-[color:var(--aqua)]"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
