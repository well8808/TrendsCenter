"use client";

import dynamic from "next/dynamic";

type LazyReelsRadarScene3DProps = {
  className?: string;
  intensity?: number;
  mode?: "library" | "radar";
};

const ReelsRadarScene3D = dynamic(
  () =>
    import("@/components/reels-radar-scene-3d").then(
      (mod) => mod.ReelsRadarScene3D,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function LazyReelsRadarScene3D(props: LazyReelsRadarScene3DProps) {
  return <ReelsRadarScene3D {...props} />;
}
