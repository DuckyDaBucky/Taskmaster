"use client";

export type CompactSelectOption = { label: string; value: string };

export default function CompactSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: CompactSelectOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "h-10 rounded-xl px-3 text-sm outline-none transition",
        "bg-white/10 border border-white/20 text-white",
        "focus:border-white/40 focus:bg-white/15",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/15",
      ].join(" ")}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#17172a] text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
