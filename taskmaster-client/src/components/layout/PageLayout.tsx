"use client";

import React from "react";
import { Sidebar } from "../Sidebar";
import { PageContent } from "./PageContent";

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
}) => {
  return (
    <div className="flex h-screen w-full bg-background bg-grid-pattern bg-grid-24 text-foreground overflow-hidden">
      <Sidebar />
      
      <PageContent>
        {children}
      </PageContent>
    </div>
  );
};
