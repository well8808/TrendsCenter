import { cn } from "@/lib/utils";

interface TrendEnergyFieldProps {
  mode: "library" | "signal-room";
  reels?: number;
  signals?: number;
  evidence?: number;
  className?: string;
}

export function TrendEnergyField({
  mode,
  reels = 0,
  signals = 0,
  evidence = 0,
  className,
}: TrendEnergyFieldProps) {
  const artifactLines = Math.max(2, Math.min(6, reels || signals || 3));
  const proofLines = Math.max(1, Math.min(5, Math.ceil(evidence / 2) || 2));

  return (
    <div
      aria-hidden="true"
      className={cn(
        "trend-energy-field pointer-events-none fixed inset-0 z-0 overflow-hidden",
        mode === "signal-room" && "trend-energy-field-signal",
        className,
      )}
    >
      <div className="trend-energy-vignette absolute inset-0" />
      <div className="trend-energy-aura trend-energy-aura-hot absolute" />
      <div className="trend-energy-aura trend-energy-aura-warm absolute" />
      <div className="trend-energy-shelves absolute inset-x-[6%] top-[11%] hidden h-[42%] md:block">
        {Array.from({ length: artifactLines }).map((_, index) => (
          <span
            key={`artifact-line-${index}`}
            className="trend-energy-line absolute left-0 h-px"
            style={{
              top: `${16 + index * 14}%`,
              width: `${72 + (index % 3) * 9}%`,
              opacity: 0.28 - index * 0.025,
            }}
          />
        ))}
      </div>
      <div className="trend-energy-proofs absolute bottom-[12%] right-[7%] hidden h-[30%] w-[28%] md:block">
        {Array.from({ length: proofLines }).map((_, index) => (
          <span
            key={`proof-line-${index}`}
            className="trend-energy-proof absolute h-px"
            style={{
              right: `${index * 8}%`,
              top: `${18 + index * 13}%`,
              width: `${48 + index * 8}%`,
              opacity: 0.2 + index * 0.035,
            }}
          />
        ))}
      </div>
    </div>
  );
}
