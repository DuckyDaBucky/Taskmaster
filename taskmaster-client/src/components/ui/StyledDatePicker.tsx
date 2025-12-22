"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DayPicker } from "react-day-picker";
import type { DropdownProps } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import DayPickerCaptionDropdown from "./DayPickerCaptionDropdown";

export default function StyledDatePicker({
  value, // "YYYY-MM-DD" or ""
  onChange,
  placeholder = "Select a date…",
  disabled,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

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

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full rounded-2xl px-4 py-3 text-left transition outline-none",
          "bg-white/10 border border-white/20 text-white",
          "focus:border-white/40 focus:bg-white/15",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/15",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <span className={selected ? "text-white" : "text-white/60"}>
            {label}
          </span>
          <span className="text-white/70">📅</span>
        </div>
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Close date picker"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl p-3"
            >
              <div className="rounded-2xl bg-white/10 p-3 border border-white/10">
                <DayPicker
                  mode="single"
                  selected={selected}
                  onSelect={selectDay}
                  captionLayout="dropdown"
                  components={{ Dropdown: DayPickerCaptionDropdown }}
                  startMonth={startMonth}
                  endMonth={endMonth}
                  className="mx-auto w-fit"
                  classNames={{
                    caption: "flex items-center justify-center gap-3 mb-3",
                    nav: "hidden",

                    head_cell: "text-white/60 text-xs font-medium text-center",
                    cell: "p-1 text-center",

                    day: "h-9 w-9 rounded-xl text-white/90 hover:bg-white/15 transition",
                    day_selected:
                      "bg-white/20 text-white ring-1 ring-white/20 hover:bg-white/25",
                    day_today: "text-white font-semibold",
                    day_outside: "text-white/25",
                    day_disabled: "text-white/25",
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="text-xs text-white/70 hover:text-white"
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
                  className="text-xs text-white/70 hover:text-white"
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
