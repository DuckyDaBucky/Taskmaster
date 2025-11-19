import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaUserFriends,
  FaChalkboardTeacher,
  FaCog,
  FaTasks,
  FaSignOutAlt,
} from "react-icons/fa";
import { SiFuturelearn } from "react-icons/si";
import { GrResources } from "react-icons/gr";
import type { IconType } from "react-icons";
import ThemeLogo from './ThemeLogo';
import { theme } from "../constants/theme";

interface NavItem {
  name: string;
  path: string;
  icon: IconType;
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: FaTachometerAlt },
    { name: "Calendar", path: "/calendar", icon: FaCalendarAlt },
    { name: "Friends", path: "/friends", icon: FaUserFriends },
    { name: "Class Manager", path: "/classes", icon: FaChalkboardTeacher },
    { name: "Tasks", path: "/tasks", icon: FaTasks },
    { name: "FlashCards", path: "/flashcards", icon: SiFuturelearn },
    { name: "Resources", path: "/resources", icon: GrResources },
    { name: "Settings", path: "/settings", icon: FaCog },
  ];

  const getNavItemStyle = (isActive: boolean): React.CSSProperties => ({
    backgroundColor: isActive ? theme.colors.activeBg : "transparent",
    color: isActive ? theme.colors.accentPrimary : theme.colors.textSecondary,
  });

  const handleNavMouseEnter = (isActive: boolean) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = theme.colors.surfaceMuted;
    }
  };

  const handleNavMouseLeave = (isActive: boolean) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = "transparent";
    }
  };

  return (
    <div 
      className="w-56 h-screen fixed top-0 left-0 flex flex-col justify-between z-20 transition-colors duration-300 font-sans"
      style={{ 
        backgroundColor: theme.colors.sidebarBg, 
        borderRight: `1px solid ${theme.colors.border}` 
      }}
    >
      {/* Top Section */}
      <div className="px-5 pt-8 pb-6">
        <Link to="/" className="flex items-center gap-3 mb-10 px-1">
          <ThemeLogo width={40} height={40} />
          <span 
            className="text-lg font-bold tracking-wide"
            style={{ color: theme.colors.textPrimary }}
          >
            TaskMasterAI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-base font-medium ${
                  isActive ? "shadow-sm" : ""
                }`}
                style={getNavItemStyle(isActive)}
                onMouseEnter={handleNavMouseEnter(isActive)}
                onMouseLeave={handleNavMouseLeave(isActive)}
              >
                <Icon 
                  size={18} 
                  className="min-w-[18px]"
                  style={{ color: isActive ? theme.colors.accentPrimary : theme.colors.textSecondary }}
                />
                <span className="flex-1 truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout Button */}
      <div className="p-5" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-base font-semibold text-white rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
          style={{ backgroundColor: theme.colors.error }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <FaSignOutAlt size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;