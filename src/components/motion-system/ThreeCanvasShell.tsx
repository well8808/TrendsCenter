"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import type { CanvasProps } from "@react-three/fiber";

import { cn } from "@/lib/utils";

const Canvas = dynamic(() => import("@react-three/fiber").then((mod) => mod.Canvas), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full min-h-48 w-full" />,
}) as ComponentType<CanvasProps>;

type ThreeCanvasShellProps = Omit<CanvasProps, "children"> & {
  children: ReactNode;
  wrapperClassName?: string;
};

export function ThreeCanvasShell({
  children,
  wrapperClassName,
  dpr = [1, 1.5],
  performance,
  gl,
  ...props
}: ThreeCanvasShellProps) {
  return (
    <div className={cn("relative min-h-48 overflow-hidden", wrapperClassName)}>
      <Canvas
        dpr={dpr}
        performance={{ min: 0.5, ...performance }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          ...gl,
        }}
        {...props}
      >
        {children}
      </Canvas>
    </div>
  );
}
