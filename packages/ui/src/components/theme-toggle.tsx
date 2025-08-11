"use client";

import * as React from "react";
import { useTheme } from "next-themes";

type ThemeToggleButtonProps = {
  className?: string;
  ariaLabel?: string;
};

export function ThemeToggleButton({
  className,
  ariaLabel = "Toggle theme",
}: ThemeToggleButtonProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={[
        "inline-flex items-center justify-center h-9 w-9 rounded-md border shadow",
        "bg-white text-black hover:bg-white/90",
        "dark:bg-black dark:text-white dark:hover:bg-black/80",
        className ?? "",
      ].join(" ")}
    >
      {isDark ? (
        // Sun icon
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1111.21 3A7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
