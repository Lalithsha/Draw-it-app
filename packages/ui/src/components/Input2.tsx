"use client";

interface typeProps {
  type: string;
  placeholder: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string; // Add name prop here
  id?: string; // Add id prop here
  required?: boolean; // Add required prop here
  autoComplete?: string; // Add autoComplete prop here
  autoFocus?: boolean; // Add autoFocus prop here
  disabled?: boolean; // Add disabled prop here
} // Closing the interface here

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
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={className}
      onChange={onChange}
      value={value}
      name={name}
      id={id}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
    />
  );
}
