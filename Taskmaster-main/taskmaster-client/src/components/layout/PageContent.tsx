import React from "react";

interface PageContentProps {
  children: React.ReactNode;
}

export const PageContent: React.FC<PageContentProps> = ({ children }) => {
  return (
    <main className="flex-1 h-full overflow-auto p-4 w-full max-w-[95%] mx-auto">
      {children}
    </main>
  );
};
