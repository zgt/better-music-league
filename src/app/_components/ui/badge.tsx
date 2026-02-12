const phaseStyles = {
  submission: "bg-accent-muted text-accent-hover",
  listening: "bg-warning/15 text-warning",
  voting: "bg-success/15 text-success",
  results: "bg-text-muted/15 text-text-secondary",
} as const;

type BadgeProps = {
  phase: keyof typeof phaseStyles;
  className?: string;
};

export function Badge({ phase, className = "" }: BadgeProps) {
  const label = phase.charAt(0).toUpperCase() + phase.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${phaseStyles[phase]} ${className}`}
    >
      {label}
    </span>
  );
}
