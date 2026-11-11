import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getNextTheme, getThemeOrder } from "@/utils/themeOrder";

const ThemeContext = createContext({ theme: "fog", setTheme: () => {}, toggleTheme: () => {} });

const KEY = "nightfall:theme";
const THEMES = getThemeOrder(false);

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  (window.matchMedia
    ? window.matchMedia("(max-width: 767px)").matches
    : window.innerWidth < 768);

const getDefaultTheme = () => {
  if (typeof window === "undefined") return "fog";
  return isMobileViewport() ? "blood" : "fog";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const defaultTheme = getDefaultTheme();
    if (typeof window === "undefined") return defaultTheme;
    const savedTheme = localStorage.getItem(KEY);
    return THEMES.includes(savedTheme) ? savedTheme : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(THEMES.includes(t) ? t : getDefaultTheme());
  }, []);
  const toggleTheme = useCallback(
    () => setThemeState((theme) => getNextTheme(theme, getThemeOrder(isMobileViewport()))),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
