import { ReactNode } from "react";
import { theme } from "../../constants/theme";

interface ChipProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Chip = ({ children, onClick, className = "" }: ChipProps) => {
  const chipStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surfaceMuted,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.chip,
    padding: "0.25rem 0.75rem", // px-3 py-1
    fontSize: "0.75rem", // text-xs
    fontWeight: 600,
    transition: "border-color 0.2s ease",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.borderColor = theme.colors.accentPrimary;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.borderColor = theme.colors.border;
  };

  const Component = onClick ? "button" : "span";

  return (
    <Component
      style={chipStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`inline-block ${className}`}
    >
      {children}
    </Component>
  );
};

