export function MiniTrendLine({ tone = "acid" }: { tone?: "acid" | "aqua" | "coral" | "gold" }) {
  const stroke = {
    acid: "var(--acid)",
    aqua: "var(--aqua)",
    coral: "var(--coral)",
    gold: "var(--gold)",
  }[tone];

  return (
    <svg viewBox="0 0 120 38" role="img" aria-label="Linha de tendencia demo" className="h-10 w-full">
      <path
        d="M2 30 C 15 28, 18 12, 31 17 S 50 34, 64 18 S 82 8, 94 14 S 105 24, 118 6"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M2 30 C 15 28, 18 12, 31 17 S 50 34, 64 18 S 82 8, 94 14 S 105 24, 118 6 L118 38 L2 38 Z"
        fill={stroke}
        opacity="0.12"
      />
    </svg>
  );
}
