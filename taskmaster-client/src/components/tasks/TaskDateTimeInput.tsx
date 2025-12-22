"use client";

import React, { useState } from "react";
import { Clock } from "lucide-react";
import { AnalogTimePicker } from "../ui/AnalogTimePicker";

interface TaskDateTimeInputProps {
  value: string | undefined; // ISO string or empty
  onChange: (value: string) => void;
}

export const TaskDateTimeInput: React.FC<TaskDateTimeInputProps> = ({
  value,
  onChange,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Helper to get date part (YYYY-MM-DD)
  const getDatePart = () => {
    if (!value) return "";
    return value.split("T")[0];
  };

  // Helper to get time part (HH:mm)
  const getTimePart = () => {
    if (!value) return "12:00";
    const parts = value.split("T");
    return parts.length > 1 ? parts[1].slice(0, 5) : "12:00";
  };

  const handleDateChange = (date: string) => {
    const time = getTimePart();
    if (date) {
      onChange(`${date}T${time}`);
    } else {
      onChange("");
    }
  };

  const handleTimeChange = (time: string) => {
    const date = getDatePart() || new Date().toISOString().split("T")[0];
    onChange(`${date}T${time}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Date Input */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Due Date</label>
        <input
          type="date"
          value={getDatePart()}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Time Input */}
      <div className="relative">
        <label className="block text-xs text-muted-foreground mb-1">Time</label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            onClick={() => {
              if (!value) handleDateChange(new Date().toISOString().split("T")[0]);
              setShowTimePicker(true);
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-secondary/50 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Clock size={16} />
          </div>
        </div>

        {/* Floating Time Picker Overlay */}
        {showTimePicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div 
              className="absolute inset-0" 
              onClick={() => setShowTimePicker(false)}
            />
            
            {/* Picker Container */}
            <div className="relative bg-surface rounded-xl shadow-2xl z-10">
              <AnalogTimePicker
                value={getTimePart()}
                onChange={handleTimeChange}
                onClose={() => setShowTimePicker(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
