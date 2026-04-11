import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "orange"
  | "blue"
  | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-accent-muted text-accent border-accent/20",
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  danger: "bg-danger-muted text-danger border-danger/20",
  purple: "bg-purple-muted text-purple border-purple/20",
  orange: "bg-orange-muted text-orange border-orange/20",
  blue: "bg-accent-muted text-accent border-accent/20",
  muted: "bg-white/5 text-muted-foreground border-white/10",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  purple: "bg-purple",
  orange: "bg-orange",
  blue: "bg-accent",
  muted: "bg-muted-foreground",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
