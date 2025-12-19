"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLayout } from "@/components/layout/PageLayout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <PageLayout>{children}</PageLayout>
    </ProtectedRoute>
  );
}
