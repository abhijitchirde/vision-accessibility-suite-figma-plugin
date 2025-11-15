import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useFigmaTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    // Save to localStorage if available
    try {
      localStorage.setItem("figma-theme", newTheme);
    } catch (error) {
      // Ignore localStorage errors in Figma plugin environment
    }
  };

  useEffect(() => {
    // Function to detect theme from Figma or system
    const detectTheme = () => {
      // Request theme information from Figma
      if (typeof parent !== "undefined" && parent.postMessage) {
        parent.postMessage(
          {
            pluginMessage: {
              type: "get-theme",
            },
          },
          "*"
        );
      }

      // Fallback: Try localStorage first
      try {
        const savedTheme = localStorage.getItem("figma-theme") as Theme;
        if (savedTheme && ["light", "dark"].includes(savedTheme)) {
          setTheme(savedTheme);
          document.documentElement.setAttribute("data-theme", savedTheme);
          return;
        }
      } catch (error) {
        // Ignore localStorage errors
      }

      // Fallback: detect theme from system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const systemTheme = prefersDark ? "dark" : "light";
      setTheme(systemTheme);
      document.documentElement.setAttribute("data-theme", systemTheme);
    };

    // Listen for theme changes from Figma
    const handleMessage = (event: MessageEvent) => {
      if (event.data.pluginMessage?.type === "theme-changed") {
        const figmaTheme = event.data.pluginMessage.theme as Theme;
        setTheme(figmaTheme);
        document.documentElement.setAttribute("data-theme", figmaTheme);

        // Save to localStorage
        try {
          localStorage.setItem("figma-theme", figmaTheme);
        } catch (error) {
          // Ignore
        }
      }
    };

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? "dark" : "light";
      setTheme(systemTheme);
      document.documentElement.setAttribute("data-theme", systemTheme);

      // Save to localStorage
      try {
        localStorage.setItem("figma-theme", systemTheme);
      } catch (error) {
        // Ignore
      }
    };

    // Add event listeners
    window.addEventListener("message", handleMessage);
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Initial theme detection
    detectTheme();

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return {
    theme,
    isDark,
    toggleTheme,
  };
}
