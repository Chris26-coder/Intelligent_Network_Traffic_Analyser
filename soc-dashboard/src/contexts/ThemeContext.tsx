'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeName, Theme } from '@/lib/types';

const THEMES: Record<ThemeName, Theme> = {
  cyberpunk: {
    name: 'cyberpunk', label: 'Cyberpunk', description: 'Clinical ultra-modern digital defense',
    bg: '#0B0E14', accent: '#00FFFF', alert: '#FF3333', secondary: '#00BFBF',
  },
  matrix: {
    name: 'matrix', label: 'The Matrix', description: 'Classic 90s terminal phosphor glow',
    bg: '#000000', accent: '#00FF41', alert: '#FFFFFF', secondary: '#00CC33',
  },
  neonred: {
    name: 'neonred', label: 'Neon Red', description: 'Aggressive tactical thermal vision',
    bg: '#140000', accent: '#FF0033', alert: '#FF9900', secondary: '#CC0000',
  },
  biohazard: {
    name: 'biohazard', label: 'Bio-Hazard', description: 'Industrial armored geometric contrast',
    bg: '#0C0A00', accent: '#FFCC00', alert: '#FF3300', secondary: '#CC9900',
  },
  'neonvoid': {
    name: 'neonvoid', label: 'Neon Void', description: 'Deep-web encryption vault style',
    bg: '#0A0012', accent: '#B829FF', alert: '#00FFFF', secondary: '#8A00CC',
  },
};

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.cyberpunk,
  themeName: 'cyberpunk',
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('cyberpunk');

  const applyTheme = useCallback((name: ThemeName) => {
    const t = THEMES[name];
    const root = document.documentElement;
    root.style.setProperty('--color-bg', t.bg);
    root.style.setProperty('--color-accent', t.accent);
    root.style.setProperty('--color-alert', t.alert);
    root.style.setProperty('--color-secondary', t.secondary);
    // Convert hex to RGB for rgba() usage
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };
    root.style.setProperty('--color-accent-rgb', hexToRgb(t.accent));
    root.style.setProperty('--color-alert-rgb', hexToRgb(t.alert));
    root.setAttribute('data-theme', name);
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem('soc-theme', name);
    applyTheme(name);
  }, [applyTheme]);

  useEffect(() => {
    const saved = localStorage.getItem('soc-theme') as ThemeName | null;
    const initial = saved && THEMES[saved] ? saved : 'cyberpunk';
    setThemeName(initial);
    applyTheme(initial);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeName], themeName, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
