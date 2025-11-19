import { useCallback } from "react";
import { theme } from "../constants/theme";

/**
 * Hook for card hover effects
 * Returns handlers for consistent hover behavior across cards
 */
export const useCardHover = (enabled = true) => {
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      e.currentTarget.style.boxShadow = theme.shadows.cardHover;
    },
    [enabled]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      e.currentTarget.style.boxShadow = theme.shadows.card;
    },
    [enabled]
  );

  return { handleMouseEnter, handleMouseLeave };
};

