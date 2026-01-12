import { ReactNode } from "react";
import { theme } from "../../constants/theme";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export const PageContainer = ({
  children,
  className = "",
  maxWidth = "95%",
}: PageContainerProps) => {
  return (
    <div
      className={className}
      style={{
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
        padding: "2rem 1.5rem", // py-8 px-6
      }}
    >
      <div
        style={{
          maxWidth,
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </div>
  );
};

