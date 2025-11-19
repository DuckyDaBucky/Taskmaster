import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the possible theme values
export type Theme = 'default' | 'light' | 'dark' | 'frost' | 'retro' | 'aqua' | 'earth';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get initial state from localStorage or default to 'default'
    const savedTheme = localStorage.getItem('appTheme') as Theme | null;
    // Validate saved theme or default
    return savedTheme && ['default', 'light', 'dark', 'frost', 'retro', 'aqua', 'earth'].includes(savedTheme) ? savedTheme : 'default';
  });

  useEffect(() => {
    // Persist state changes to localStorage
    localStorage.setItem('appTheme', theme);

    // Apply the theme attribute to the HTML element
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 

export { ThemeContext };
