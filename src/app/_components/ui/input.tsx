import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  description?: string;
};

export function Input({
  label,
  error,
  description,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-text-muted">{description}</p>
      )}
      <input
        id={id}
        className={`rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 ${error ? "border-danger focus:border-danger focus:ring-danger" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
