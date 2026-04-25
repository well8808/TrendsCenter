"use client";

import { animate, motion, useMotionValue, type Variants } from "motion/react";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease } },
};

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.9, delay, ease });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, value, delay]);

  return <>{display}</>;
}

type StatTone = "acid" | "aqua" | "gold" | "violet";

const toneMap: Record<StatTone, { text: string; border: string; bg: string; glow: string }> = {
  acid: {
    text: "var(--acid)",
    border: "rgba(199,255,93,0.26)",
    bg: "rgba(199,255,93,0.08)",
    glow: "rgba(199,255,93,0.18)",
  },
  aqua: {
    text: "var(--aqua)",
    border: "rgba(64,224,208,0.26)",
    bg: "rgba(64,224,208,0.08)",
    glow: "rgba(64,224,208,0.14)",
  },
  gold: {
    text: "var(--gold)",
    border: "rgba(243,201,105,0.26)",
    bg: "rgba(243,201,105,0.08)",
    glow: "rgba(243,201,105,0.14)",
  },
  violet: {
    text: "var(--violet)",
    border: "rgba(169,140,255,0.26)",
    bg: "rgba(169,140,255,0.08)",
    glow: "rgba(169,140,255,0.14)",
  },
};

export interface TrendStat {
  label: string;
  value: number;
  tone: StatTone;
  suffix?: string;
}

export function TrendStatsDeck({ stats }: { stats: TrendStat[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]"
    >
      {stats.map((stat, idx) => {
        const t = toneMap[stat.tone];
        return (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease }}
            className="group relative overflow-hidden rounded-[var(--radius-md)] border p-3"
            style={{
              borderColor: t.border,
              background: `linear-gradient(180deg, ${t.bg}, rgba(0,0,0,0.24))`,
            }}
          >
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl"
              style={{ background: t.glow }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.06, ease }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-3 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${t.border}, transparent)` }}
            />
            <p className="relative eyebrow" style={{ color: t.text }}>
              {stat.label}
            </p>
            <p className="relative metric-value-xl mt-3 text-[color:var(--foreground)]">
              <AnimatedNumber value={stat.value} delay={0.2 + idx * 0.06} />
              {stat.suffix ? (
                <span className="ml-1 font-mono text-[11px] tracking-[0.14em] text-[color:var(--muted)]">
                  {stat.suffix}
                </span>
              ) : null}
            </p>
            <div className="relative mt-2 h-[2px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.045)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${t.text}, transparent)` }}
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2.6,
                  delay: 0.5 + idx * 0.06,
                  ease: "linear",
                  repeat: Infinity,
                  repeatDelay: 1.6,
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
