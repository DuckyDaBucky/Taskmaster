import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";
import { theme } from "../constants/theme";

function PageLayout() {
  const themeContext = useContext(ThemeContext);
  const currentTheme = themeContext?.theme;

  return (
    <div 
      className="relative flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: theme.colors.background }}
    >
      {currentTheme !== "light" && <AnimatedBackground />}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main 
          className="ml-56 flex-grow overflow-y-auto px-6 py-4 z-10 relative"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PageLayout;
