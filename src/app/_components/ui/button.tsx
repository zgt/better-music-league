import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent/50",
  secondary:
    "bg-bg-tertiary text-text-primary hover:bg-bg-elevated border border-border focus-visible:ring-border",
  danger:
    "bg-danger text-white hover:bg-danger/80 focus-visible:ring-danger/50",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary focus-visible:ring-border",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
