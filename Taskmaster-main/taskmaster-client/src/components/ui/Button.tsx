import { ReactNode, ButtonHTMLAttributes } from "react";
import { theme } from "../../constants/theme";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "destructive";
  className?: string;
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: theme.borderRadius.button,
      padding: "0.5rem 1rem", // py-2 px-4
      transition: "all 0.2s ease",
      fontWeight: 600,
      fontSize: "0.875rem",
      cursor: disabled ? "not-allowed" : "pointer",
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.accentPrimary,
          color: "#FFFFFF",
          border: "none",
          opacity: disabled ? 0.6 : 1,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceMuted,
          color: theme.colors.textPrimary,
          border: `1px solid ${theme.colors.border}`,
          opacity: disabled ? 0.6 : 1,
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          color: theme.colors.textSecondary,
          border: `1px solid ${theme.colors.border}`,
        };
      case "destructive":
        return {
          ...baseStyle,
          backgroundColor: theme.colors.error,
          color: "#FFFFFF",
          border: "none",
        };
      default:
        return baseStyle;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const style = e.currentTarget.style;
    
    switch (variant) {
      case "primary":
        style.backgroundColor = theme.colors.accentHover;
        break;
      case "secondary":
      case "outline":
        style.backgroundColor = theme.colors.activeBg;
        style.borderColor = theme.colors.accentPrimary;
        if (variant === "outline") {
          style.color = theme.colors.accentPrimary;
        }
        break;
      case "destructive":
        style.opacity = "0.9";
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const style = e.currentTarget.style;
    const originalStyle = getButtonStyle();
    
    Object.keys(originalStyle).forEach((key) => {
      const styleKey = key as keyof React.CSSProperties;
      if (styleKey !== "cursor") {
        (style as any)[styleKey] = (originalStyle as any)[styleKey];
      }
    });
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={getButtonStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </button>
  );
};

