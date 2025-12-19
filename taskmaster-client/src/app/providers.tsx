"use client";

import React from "react";
import AIAssistant from "@/components/AIAssistant";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        {children}
        <AIAssistant />
      </UserProvider>
    </ThemeProvider>
  );
}
