"use client";

import { useRef, useEffect } from "react";

interface typeProps {
  type: string;
  placeholder: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function Input({
  type,
  placeholder,
  className,
  onChange,
  value,
  name,
  id,
  required,
  autoComplete,
  autoFocus,
  disabled,
}: typeProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle autoFocus in useEffect to avoid hydration mismatch
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      className={className}
      onChange={onChange}
      value={value || ""}
      name={name}
      id={id}
      required={required || false}
      autoComplete={autoComplete}
      disabled={disabled || false}
    />
  );
}
