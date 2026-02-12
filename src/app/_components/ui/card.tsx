import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  header?: ReactNode;
  noPadding?: boolean;
  hover?: boolean;
};

export function Card({
  header,
  noPadding = false,
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-bg-secondary ${hover ? "transition-colors hover:border-border-hover hover:bg-bg-tertiary" : ""} ${className}`}
      {...props}
    >
      {header && (
        <div className="border-b border-border px-5 py-4 font-medium">
          {header}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
