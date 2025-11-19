import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the possible theme values
export type Theme = 'light' | 'dark' | 'clean';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get initial state from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('appTheme') as Theme | null;
    // Validate saved theme or default
    return savedTheme && ['light', 'dark', 'clean'].includes(savedTheme) ? savedTheme : 'light';
  });

  useEffect(() => {
    // Persist state changes to localStorage
    localStorage.setItem('appTheme', theme);

    // Apply the theme class to the HTML element
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'clean'); // Remove all theme classes
    root.classList.add(theme); // Add the current theme class

  }, [theme]);

  // Wrapper function to ensure type safety if needed in future
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
