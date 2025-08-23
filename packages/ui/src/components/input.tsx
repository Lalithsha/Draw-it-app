"use client";

import * as React from "react";
import { cn } from "../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, autoFocus, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const inputRef = ref || internalRef;

    // Handle autoFocus in useEffect to avoid hydration mismatch
    React.useEffect(() => {
      if (autoFocus && inputRef && "current" in inputRef && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus, inputRef]);

    // Remove autoFocus from props and ensure value is always a string to prevent hydration mismatch
    const {
      autoFocus: _autoFocus,
      value,
      ...inputProps
    } = { autoFocus, ...props };
    // Suppress ESLint warning for unused variable
    void _autoFocus;

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={inputRef}
        // Ensure value is always a string to prevent hydration mismatch
        value={value || ""}
        // Never set autoFocus prop to avoid hydration mismatch
        {...inputProps}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
