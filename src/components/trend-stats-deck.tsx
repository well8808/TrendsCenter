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

export interface TrendStat {
  label: string;
  value: number;
  tone: StatTone;
  suffix?: string;
}

// Antes: 4 cores diferentes, glow blur, scan-line animado, gradient bg.
// Agora: tiles uniformes em neutro com hairline divider. O número é o
// protagonista. O `tone` ainda é aceito por compat, mas só o primeiro stat
// (dominante) recebe accent vermelho — os outros ficam em foreground.
export function TrendStatsDeck({ stats }: { stats: TrendStat[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid min-w-0 grid-cols-2 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[rgba(0,0,0,0.22)] sm:grid-cols-4 xl:min-w-[480px]"
    >
      {stats.map((stat, idx) => {
        const isPrimary = idx === 0;
        return (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className={
              "relative px-4 py-3 " +
              (idx > 0 ? "border-l border-[color:var(--line)] " : "")
            }
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[color:var(--muted)]">
              {stat.label}
            </p>
            <p
              className="metric-value-xl mt-2.5"
              style={{ color: isPrimary ? "var(--hot)" : "var(--foreground)" }}
            >
              <AnimatedNumber value={stat.value} delay={0.2 + idx * 0.06} />
              {stat.suffix ? (
                <span className="ml-1 font-mono text-[11px] tracking-[0.1em] text-[color:var(--muted)]">
                  {stat.suffix}
                </span>
              ) : null}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
