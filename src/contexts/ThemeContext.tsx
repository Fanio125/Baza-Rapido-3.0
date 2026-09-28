import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('vambora_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Default to light
      return 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const docEl = window.document.documentElement;
    const bodyEl = window.document.body;
    if (theme === 'dark') {
      docEl.classList.add('dark');
      bodyEl.classList.add('dark');
    } else {
      docEl.classList.remove('dark');
      bodyEl.classList.remove('dark');
    }
    
    try {
      localStorage.setItem('vambora_theme', theme);
    } catch (err) {
      console.error('Erro ao guardar o tema:', err);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
