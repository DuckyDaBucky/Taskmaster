/**
 * Theme Constants
 * Centralized color palette and styling values for the modern clean dashboard
 */

export const theme = {
  colors: {
    // Primary colors
    accentPrimary: "#6B6BFF",
    accentHover: "#5A5AE3",
    
    // Text colors
    textPrimary: "#2B2D33",
    textSecondary: "#6C7080",
    
    // Background colors
    background: "#F3F4FB",
    surface: "rgba(255, 255, 255, 0.95)",
    surfaceMuted: "#F5F6FA",
    sidebarBg: "#F8F9FC",
    
    // Border colors
    border: "#E3E4EC",
    
    // Status colors
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    
    // Interactive states
    activeBg: "#E8EAFF",
  },
  
  spacing: {
    cardPadding: "1.25rem", // 20px / p-5
    cardGap: "1rem", // 16px / gap-4 (30% reduction from gap-6)
    sectionGap: "1.5rem", // 24px / space-y-6 (reduced from space-y-10)
  },
  
  borderRadius: {
    card: "8px",
    button: "8px",
    chip: "8px",
  },
  
  shadows: {
    card: "0px 2px 6px rgba(0, 0, 0, 0.06)",
    cardHover: "0px 4px 8px rgba(0, 0, 0, 0.08)",
    modal: "0px 4px 12px rgba(0, 0, 0, 0.12)",
  },
  
  opacity: {
    backgroundSquares: 0.08, // 8% opacity for animated background
    card: 0.95,
  },
} as const;

export type Theme = typeof theme;

