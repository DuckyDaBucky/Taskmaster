"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AIAssistant from "@/components/AIAssistant";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const hideAssistant = pathname.startsWith("/ask-taskmaster");

  return (
    <ThemeProvider>
      <UserProvider>
        {children}
        {!hideAssistant && <AIAssistant />}
      </UserProvider>
    </ThemeProvider>
  );
}
