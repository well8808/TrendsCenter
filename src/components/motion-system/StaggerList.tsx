"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

type StaggerListProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  itemClassName?: string;
  stagger?: number;
  y?: number;
};

export function StaggerList({
  children,
  className,
  itemClassName,
  stagger = 0.055,
  y = 12,
  ...props
}: StaggerListProps) {
  const prefersReducedMotion = useReducedMotion();
  const items = Children.toArray(children);

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: prefersReducedMotion ? undefined : { staggerChildren: stagger },
    },
  };

  const itemVariants: Variants = prefersReducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.34, ease } },
      };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={containerVariants}
      {...props}
    >
      {items.map((child, index) => (
        <motion.div key={index} className={cn("min-w-0", itemClassName)} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
