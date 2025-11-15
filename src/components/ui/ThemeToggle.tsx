import * as React from "react";
import { useFigmaTheme } from "../../hooks/useFigmaTheme";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useFigmaTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      style={{
        padding: "4px 8px",
        fontSize: "11px",
        border: "1px solid var(--figma-color-border)",
        borderRadius: "4px",
        backgroundColor: "var(--figma-color-bg)",
        color: "var(--figma-color-text)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        minWidth: "20px",
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
