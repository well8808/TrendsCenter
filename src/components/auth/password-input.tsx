"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClass =
  "app-control w-full rounded-[var(--radius-sm)] px-3 py-3 pr-24 text-sm outline-none";

export function PasswordInput({
  label,
  name = "password",
  autoComplete,
  minLength,
}: {
  label: string;
  name?: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="grid gap-2">
      <label
        className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={inputClass}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--line)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-strong)] transition hover:border-[rgba(64,224,208,0.42)] hover:text-[color:var(--aqua)]"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Ver senha"}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          {visible ? "ocultar" : "ver"}
        </button>
      </div>
    </div>
  );
}
