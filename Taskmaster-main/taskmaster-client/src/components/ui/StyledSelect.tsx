"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type StyledSelectOption = {
  label: string;
  value: string;
};

type StyledSelectProps = {
  value: string;
  options: StyledSelectOption[];
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  variant?: "onboarding" | "settings";
};

export default function StyledSelect({
  value,
  options,
  placeholder = "Select one…",
  onChange,
  disabled,
  variant = "onboarding",
}: StyledSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const isSettings = variant === "settings";

  const triggerClass = isSettings
    ? [
        "bg-background border border-border text-foreground",
        "focus:ring-2 focus:ring-primary/40 focus:border-primary",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-secondary",
      ].join(" ")
    : [
        "bg-white/10 border border-white/20 text-white",
        "focus:border-white/40 focus:bg-white/15",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/15",
      ].join(" ");

  const placeholderClass = isSettings
    ? "text-muted-foreground"
    : "text-white/60";
  const valueTextClass = isSettings ? "text-foreground" : "text-white";
  const chevronClass = isSettings ? "text-muted-foreground" : "text-white/70";

  const menuClass = isSettings
    ? "border border-border bg-card text-foreground shadow-lg"
    : "border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl";

  const optionBaseClass = "w-full px-4 py-2.5 text-left text-sm transition";
  const optionActiveClass = isSettings
    ? "bg-primary/10 text-foreground"
    : "bg-white/15 text-white";
  const optionIdleClass = isSettings
    ? "text-foreground hover:bg-primary/10"
    : "text-white/80 hover:bg-white/10 hover:text-white";

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full rounded-2xl px-4 py-3 text-left transition outline-none",
          triggerClass,
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={value ? valueTextClass : placeholderClass}>
            {value ? selectedLabel : placeholder}
          </span>

          <svg
            className={[
              "h-5 w-5 transition-transform",
              chevronClass,
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Close dropdown"
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={[
                "absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-2xl",
                menuClass,
              ].join(" ")}
            >
              <div className="max-h-64 overflow-auto py-2">
                {options.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={[
                        optionBaseClass,
                        active ? optionActiveClass : optionIdleClass,
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
