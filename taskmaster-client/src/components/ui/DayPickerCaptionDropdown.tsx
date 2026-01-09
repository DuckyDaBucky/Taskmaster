"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DropdownProps, DropdownOption } from "react-day-picker";

function makeChangeEvent(
  nextValue: string,
  name: string | undefined,
  onChange: DropdownProps["onChange"]
) {
  const event = {
    target: { value: nextValue, name: name ?? "" },
    currentTarget: { value: nextValue, name: name ?? "" },
  } as unknown as React.ChangeEvent<HTMLSelectElement>;

  onChange?.(event);
}

export default function DayPickerCaptionDropdown(
  props: DropdownProps & { variant?: "onboarding" | "settings" }
) {
  const { value, options, onChange, name, disabled, variant } = props;

  const isSettings = props.variant === "settings";

  const opts = useMemo(() => {
    return (options ?? []).map((o: DropdownOption) => ({
      value: String(o.value),
      label: String(o.label ?? o.value),
    }));
  }, [options]);

  const selectedLabel =
    opts.find((o) => o.value === String(value ?? ""))?.label ?? "";

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          "h-11 min-w-[150px] rounded-2xl px-4 text-sm font-medium outline-none transition",
          "flex items-center justify-between gap-3",
          isSettings
            ? "bg-background border border-border text-foreground hover:bg-secondary focus:ring-2 focus:ring-primary/30 focus:border-primary"
            : "bg-white/10 border border-white/15 text-white/90 hover:bg-white/15 focus:border-white/30 focus:bg-white/15",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span className="truncate">{selectedLabel}</span>
        <span
          className={isSettings ? "text-muted-foreground" : "text-white/60"}
        ></span>
      </button>

      {open && !disabled && (
        <div
          className={[
            "absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl shadow-2xl",
            isSettings
              ? "border border-border bg-card"
              : "border border-white/15 bg-[#1a1933]/90 backdrop-blur-xl",
          ].join(" ")}
        >
          <div className="max-h-64 overflow-y-auto p-2">
            {opts.map((o) => {
              const active = o.value === String(value ?? "");
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    makeChangeEvent(o.value, name, onChange);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-left px-4 py-3 rounded-xl text-sm transition",
                    active
                      ? isSettings
                        ? "bg-secondary text-foreground"
                        : "bg-white/15 text-white"
                      : isSettings
                      ? "text-foreground hover:bg-secondary"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
