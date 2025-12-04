import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BookOpen, 
  FileText, 
  Zap, 
  MessageSquare, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { authService } from "../services/authService";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: logoutUserContext } = useUser();

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Tasks", path: "/tasks", icon: CheckSquare },
    { label: "Calendar", path: "/calendar", icon: Calendar },
    { label: "Classes", path: "/classes", icon: BookOpen },
    { label: "Resources", path: "/resources", icon: FileText },
    { label: "Flashcards", path: "/flashcards", icon: Zap },
    { label: "Friends", path: "/friends", icon: MessageSquare },
  ];

  return (
    <aside className="h-screen w-64 bg-surface border-r border-border-color flex flex-col sticky top-0 left-0 shrink-0">
      {/* SECTION A: BRANDING */}
      <div className="p-6 border-b border-border-color">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Taskmaster
        </h1>
      </div>

      {/* SECTION B: MAIN NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                ${isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
                }
              `}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* SECTION C: USER & SYSTEM */}
      <div className="mt-auto border-t border-border-color p-4 space-y-2">
        {/* Profile Row */}
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          {(user as any)?.pfp ? (
            <img 
              src={(user as any).pfp} 
              alt={user?.firstName || user?.username || user?.email || "User"} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
              {(user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
          )}
          <span className="text-sm text-foreground font-medium">
            {user?.firstName || user?.username || user?.email || "User"}
          </span>
        </div>

        {/* System Links */}
        <button 
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Logout button clicked");
            // Clear UserContext state first
            logoutUserContext();
            // Then clear localStorage and redirect
            authService.logout();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-background hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};