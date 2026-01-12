"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import DayPickerCaptionDropdown from "./DayPickerCaptionDropdown";

type StyledDatePickerProps = {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (isoDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: "onboarding" | "settings";
};

export default function StyledDatePicker({
  value,
  onChange,
  placeholder = "Select a date…",
  disabled,
  variant = "onboarding",
}: StyledDatePickerProps) {
  const [open, setOpen] = useState(false);

  const isSettings = variant === "settings";

  const selected = useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  const label = selected ? format(selected, "MMM d, yyyy") : placeholder;

  function selectDay(d?: Date) {
    if (!d) return;
    const iso = format(d, "yyyy-MM-dd");
    onChange(iso);
    setOpen(false);
  }

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear() + 50, 11, 1);

  // Trigger styling
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

  const labelClass = isSettings
    ? selected
      ? "text-foreground"
      : "text-muted-foreground"
    : selected
    ? "text-white"
    : "text-white/60";

  const iconClass = isSettings ? "text-muted-foreground" : "text-white/70";

  // Popover styling
  const popoverClass = isSettings
    ? "border border-border bg-card text-foreground shadow-lg"
    : "border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl";

  const innerPanelClass = isSettings
    ? "rounded-2xl bg-background p-3 border border-border"
    : "rounded-2xl bg-white/10 p-3 border border-white/10";

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
          <span className={labelClass}>{label}</span>
          <span className={iconClass}>📅</span>
        </div>
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <>
            {!isSettings && (
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setOpen(false)}
                aria-label="Close date picker"
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={[
                isSettings
                  ? "relative mt-2 max-w-full overflow-hidden rounded-2xl p-3"
                  : "absolute z-20 mt-2 max-w-full overflow-hidden rounded-2xl p-3",
                popoverClass,
              ].join(" ")}
            >
              <div className={innerPanelClass}>
                <DayPicker
                  mode="single"
                  selected={selected}
                  onSelect={selectDay}
                  captionLayout="dropdown"
                  components={{
                    Dropdown: (p) => (
                      <DayPickerCaptionDropdown {...p} variant={variant} />
                    ),
                  }}
                  startMonth={startMonth}
                  endMonth={endMonth}
                  className="mx-auto w-fit"
                  classNames={{
                    caption: "flex items-center justify-center gap-3 mb-3",
                    nav: "hidden",

                    head_cell: isSettings
                      ? "text-muted-foreground text-xs font-medium text-center"
                      : "text-white/60 text-xs font-medium text-center",
                    cell: "p-1 text-center",

                    day: isSettings
                      ? "h-9 w-9 rounded-xl text-foreground hover:bg-secondary transition"
                      : "h-9 w-9 rounded-xl text-white/90 hover:bg-white/15 transition",

                    day_selected: isSettings
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/20 hover:bg-primary/20"
                      : "bg-white/20 text-white ring-1 ring-white/20 hover:bg-white/25",

                    day_today: isSettings
                      ? "text-foreground font-semibold"
                      : "text-white font-semibold",

                    day_outside: isSettings
                      ? "text-muted-foreground/50"
                      : "text-white/25",
                    day_disabled: isSettings
                      ? "text-muted-foreground/50"
                      : "text-white/25",
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className={
                    isSettings
                      ? "text-xs text-muted-foreground hover:text-foreground"
                      : "text-xs text-white/70 hover:text-white"
                  }
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const todayIso = format(new Date(), "yyyy-MM-dd");
                    onChange(todayIso);
                    setOpen(false);
                  }}
                  className={
                    isSettings
                      ? "text-xs text-muted-foreground hover:text-foreground"
                      : "text-xs text-white/70 hover:text-white"
                  }
                >
                  Today
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
