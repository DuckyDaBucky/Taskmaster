import React from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
  isCollapsed,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        group flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-md transition-colors
        ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }
        ${isCollapsed ? "justify-center px-2" : ""}
      `}
      title={isCollapsed ? label : undefined}
    >
      <span className="shrink-0 text-lg">{icon}</span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  );
};
