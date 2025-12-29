"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  FileText,
  Zap,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { authService } from "../services/api";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", path: "/tasks", icon: CheckSquare },
  { label: "Calendar", path: "/calendar", icon: Calendar },
  { label: "Classes", path: "/classes", icon: BookOpen },
  { label: "Resources", path: "/resources", icon: FileText },
  { label: "Flashcards", path: "/flashcards", icon: Zap },
  { label: "Friends", path: "/friends", icon: MessageSquare },
];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user } = useUser();

  const logout = async () => {
    try {
      await authService.logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  };

  return (
    <aside className="h-screen w-64 bg-surface border-r border-border-color flex flex-col sticky top-0 left-0 shrink-0">
      {/* Branding */}
      <div className="p-6 border-b border-border-color">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Taskmaster
        </h1>
      </div>

      {/* Navigation - Using Link for prefetch */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }
              `}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & System */}
      <div className="mt-auto border-t border-border-color p-4 space-y-2">
        {/* Profile */}
        <Link
          href="/settings"
          prefetch={true}
          className="flex items-center gap-3 px-2 py-2 mb-2 rounded-md hover:bg-background transition-colors cursor-pointer"
        >
          {user?.pfp ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={user.pfp}
                alt={
                  user?.firstName || user?.displayName || user?.email || "User"
                }
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
              {(
                user?.firstName?.[0] ||
                user?.displayName?.[0] ||
                user?.email?.[0] ||
                "?"
              ).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-foreground font-medium truncate max-w-[140px]">
            {user?.firstName ||
              user?.displayName ||
              user?.email?.split("@")[0] ||
              "Loading..."}
          </span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-background hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
