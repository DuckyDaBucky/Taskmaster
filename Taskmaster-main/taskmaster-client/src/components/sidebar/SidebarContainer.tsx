import React from "react";

interface SidebarContainerProps {
  children: React.ReactNode;
  isCollapsed?: boolean;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({
  children,
  isCollapsed,
}) => {
  return (
    <aside
      className={`
        flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[64px]" : "w-[200px]"}
      `}
    >
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {children}
      </div>
    </aside>
  );
};
