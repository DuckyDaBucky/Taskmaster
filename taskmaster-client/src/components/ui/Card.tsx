import { motion } from "framer-motion";
import { ReactNode } from "react";
import { theme } from "../../constants/theme";

interface CardProps {
  children: ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
  hoverable?: boolean;
}

const fadeVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6 } },
};

export const Card = ({ 
  children, 
  title, 
  onClick, 
  className = "",
  hoverable = true 
}: CardProps) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.card,
    boxShadow: theme.shadows.card,
    padding: theme.spacing.cardPadding,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable) {
      e.currentTarget.style.boxShadow = theme.shadows.cardHover;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable) {
      e.currentTarget.style.boxShadow = theme.shadows.card;
    }
  };

  const cardContent = (
    <>
      {title && (
        <h2 
          className="text-xl font-bold mb-3"
          style={{ color: theme.colors.textPrimary }}
        >
          {title}
        </h2>
      )}
      <div 
        className="text-sm"
        style={{ color: theme.colors.textSecondary }}
      >
        {children}
      </div>
    </>
  );

  if (onClick) {
    return (
      <motion.div
        variants={fadeVariant}
        initial="hidden"
        animate="visible"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`cursor-pointer transition duration-300 ${className}`}
        style={cardStyle}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeVariant}
      initial="hidden"
      animate="visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`transition duration-300 ${className}`}
      style={cardStyle}
    >
      {cardContent}
    </motion.div>
  );
};

