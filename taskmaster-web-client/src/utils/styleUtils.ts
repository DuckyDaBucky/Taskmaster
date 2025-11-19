import { theme } from "../constants/theme";

/**
 * Style utility functions
 * Centralized functions for common styling patterns
 */

export const getCardStyle = (): React.CSSProperties => ({
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.card,
  boxShadow: theme.shadows.card,
  padding: theme.spacing.cardPadding,
});

export const getTextStyle = (
  variant: "primary" | "secondary" = "primary"
): React.CSSProperties => ({
  color: variant === "primary" ? theme.colors.textPrimary : theme.colors.textSecondary,
});

export const getHeadingStyle = (): React.CSSProperties => ({
  color: theme.colors.textPrimary,
});

export const getInputStyle = (): React.CSSProperties => ({
  border: `1px solid ${theme.colors.border}`,
  backgroundColor: "#FFFFFF",
  color: theme.colors.textPrimary,
  borderRadius: theme.borderRadius.button,
  padding: "0.5rem 0.75rem", // py-1 px-3
});

export const getStatusColor = (
  status: "pending" | "completed" | "overdue"
): string => {
  switch (status) {
    case "completed":
      return theme.colors.success;
    case "overdue":
      return theme.colors.error;
    case "pending":
      return theme.colors.accentPrimary;
    default:
      return theme.colors.border;
  }
};

