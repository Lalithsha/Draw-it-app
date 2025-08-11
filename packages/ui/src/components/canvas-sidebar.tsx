"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { useTheme } from "next-themes";

// Lightweight inline icons to avoid cross-version React type issues
function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const Icons = {
  X: (props: { className?: string }) => (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Command: (props: { className?: string }) => (
    <Icon
      className={props.className}
      path="M9 3a3 3 0 000 6h6a3 3 0 100-6H9zm0 12a3 3 0 110 6h6a3 3 0 110-6H9zM3 9a3 3 0 016 0v6a3 3 0 11-6 0V9zm12 0a3 3 0 016 0v6a3 3 0 11-6 0V9z"
    />
  ),
  Trash: (props: { className?: string }) => (
    <Icon
      className={props.className}
      path="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 4v8m4-8v8"
    />
  ),
  Download: (props: { className?: string }) => (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: (props: { className?: string }) => (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Share: (props: { className?: string }) => (
    <Icon
      className={props.className}
      path="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"
    />
  ),
  LogIn: (props: { className?: string }) => (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  LogOut: (props: { className?: string }) => (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export interface CanvasSidebarProps {
  onFind?: () => void;
  onOpenShare?: () => void;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  className?: string;
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CanvasSidebar({
  onFind,
  onOpenShare,
  isAuthenticated,
  onSignIn,
  onSignOut,
  className,
  children,
  isOpen,
  onOpenChange,
}: CanvasSidebarProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    setInternalOpen(v);
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Compact panel */}
          <aside
            className={cn(
              // Position the panel just below the trigger (which sits at top-3, h-9 => ~3rem)
              // 3rem + 0.5rem spacing => top-14
              "fixed left-3 top-14 z-50 w-[300px] max-h-[80svh] overflow-hidden",
              "rounded-xl border border-black/10 dark:border-white/10 shadow-xl",
              "bg-white text-black dark:bg-neutral-900 dark:text-white"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-black/10 dark:border-white/10">
              <div className="text-sm font-medium">Actions</div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md border bg-white text-black hover:bg-white/90 dark:bg-black dark:text-white dark:border-white/20"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3">
              {/* Scroll area */}
              <div className="max-h-[65svh] overflow-auto pr-1">
                <NavItem
                  icon={<Icons.Command className="h-4 w-4" />}
                  label="Command palette"
                  kbd="Ctrl+/"
                  onClick={onFind}
                />
                <NavItem
                  icon={<Icons.Trash className="h-4 w-4" />}
                  label="Clear canvas"
                />
                <NavItem
                  icon={<Icons.Download className="h-4 w-4" />}
                  label="Export Drawing"
                />
                <NavItem
                  icon={<Icons.Upload className="h-4 w-4" />}
                  label="Import Drawing"
                />
                <NavItem
                  icon={<Icons.Share className="h-4 w-4" />}
                  label="Live collaboration"
                  onClick={onOpenShare}
                />

                <div className="my-3 border-t border-black/10 dark:border-white/10" />

                {isAuthenticated ? (
                  <NavItem
                    icon={<Icons.LogOut className="h-4 w-4" />}
                    label="Sign out"
                    onClick={onSignOut}
                  />
                ) : (
                  <NavItem
                    icon={<Icons.LogIn className="h-4 w-4" />}
                    label="Sign in"
                    onClick={onSignIn}
                  />
                )}

                <div className="my-3 border-t border-black/10 dark:border-white/10" />

                <ThemeSection />
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="w-full h-full">{children}</div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  onClick,
  kbd,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  kbd?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-md px-3 py-2 text-left",
        "hover:bg-black/5 dark:hover:bg-white/10"
      )}
    >
      <span className="shrink-0 text-neutral-600 dark:text-neutral-300">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {kbd ? (
        <span className="text-[10px] rounded border px-1 py-0.5 text-neutral-600 dark:text-neutral-300 border-black/10 dark:border-white/10">
          {kbd}
        </span>
      ) : null}
    </button>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const isLight = theme === "light";
  const isSystem = theme === "system" || (!isDark && !isLight);

  return (
    <div className="text-xs text-neutral-700 dark:text-neutral-300">
      <div className="font-medium mb-2">Theme</div>
      <div className="flex items-center gap-2">
        <ThemePill
          label="System"
          active={isSystem}
          onClick={() => setTheme("system")}
        />
        <ThemePill
          label="Dark"
          active={isDark}
          onClick={() => setTheme("dark")}
        />
        <ThemePill
          label="Light"
          active={isLight}
          onClick={() => setTheme("light")}
        />
      </div>
    </div>
  );
}

function ThemePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded-md border text-[11px]",
        active
          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
          : "border-black/10 dark:border-white/10 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}

export function CanvasSidebarTrigger({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className={cn(
        "h-9 w-9 z-50 bg-white text-black border shadow hover:bg-white/90",
        "dark:bg-black dark:text-white dark:border-white/20 dark:hover:bg-black/80 rounded-md",
        className
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
