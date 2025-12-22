"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalogTimePickerProps {
  value: string; // Format "HH:mm" (24h)
  onChange: (value: string) => void;
  onClose: () => void;
}

export const AnalogTimePicker: React.FC<AnalogTimePickerProps> = ({
  value,
  onChange,
  onClose,
}) => {
  // Parse initial time
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        setMeridiem(h >= 12 ? "PM" : "AM");
        setHours(h % 12 === 0 ? 12 : h % 12);
        setMinutes(m);
      }
    }
  }, []); // Only run on mount to respect prop value initially

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSave = () => {
    let h = hours;
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    
    const timeString = `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    onChange(timeString);
    onClose();
  };

  // Clock math
  const numbers = mode === "hours" 
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const currentVal = mode === "hours" ? hours : minutes;
  const rotation = mode === "hours" 
    ? (hours % 12) * 30 
    : minutes * 6;

  return (
    <div className="z-50" ref={pickerRef}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-border shadow-xl rounded-xl w-72 overflow-hidden"
      >
        {/* Header - Digital Display */}
        <div className="bg-primary/10 p-4 flex items-center justify-center gap-2 border-b border-border/50">
          <div className="flex items-baseline text-4xl font-bold text-primary">
            <button 
              onClick={() => setMode("hours")}
              className={`transition-opacity ${mode === "hours" ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
            >
              {hours.toString().padStart(2, "0")}
            </button>
            <span className="opacity-50 text-2xl mx-1">:</span>
            <button 
              onClick={() => setMode("minutes")}
              className={`transition-opacity ${mode === "minutes" ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
            >
              {minutes.toString().padStart(2, "0")}
            </button>
          </div>
          <div className="flex flex-col ml-4 gap-1">
            <button
              onClick={() => setMeridiem("AM")}
              className={`text-xs font-bold px-2 py-1 rounded ${meridiem === "AM" ? "bg-primary text-white" : "bg-card hover:bg-border"}`}
            >
              AM
            </button>
            <button
              onClick={() => setMeridiem("PM")}
              className={`text-xs font-bold px-2 py-1 rounded ${meridiem === "PM" ? "bg-primary text-white" : "bg-card hover:bg-border"}`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock Face */}
        <div className="p-6">
          <div className="relative w-56 h-56 mx-auto bg-card rounded-full border-2 border-border shadow-inner">
            {/* Numbers */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {numbers.map((num, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180); // Start at 12 (top)
                  // Adjust angle for numbers array order if needed. 
                  // For hours: 12 is at -90deg. 1 is at -60deg.
                  // Wait, my numbers array starts with 12.
                  
                  // Correct mapping:
                  // 12 -> -90
                  // 1 -> -60
                  // ...
                  const valueForPos = mode === "hours" ? (num === 12 ? 0 : num) : num / 5;
                  const deg = (valueForPos * 30) - 90;
                  const rad = deg * (Math.PI / 180);
                  
                  const radius = 90; // px
                  const x = 112 + radius * Math.cos(rad);
                  const y = 112 + radius * Math.sin(rad);

                  const isSelected = num === currentVal;

                  return (
                    <button
                      key={num}
                      onClick={() => {
                        if (mode === "hours") {
                          setHours(num);
                          setMode("minutes");
                        } else {
                          setMinutes(num);
                        }
                      }}
                      className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-sm font-medium transition-colors z-20 ${
                        isSelected 
                          ? "bg-primary text-white" 
                          : "text-foreground hover:bg-border"
                      }`}
                      style={{ left: x, top: y }}
                    >
                      {num}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2 bg-card">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-border rounded-md"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:opacity-90 font-medium"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
};
