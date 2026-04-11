import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ReactNode;
  accentColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changePositive,
  icon,
  accentColor = "bg-accent",
}: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accentColor, "bg-opacity-15")}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              changePositive
                ? "text-success bg-success-muted"
                : "text-danger bg-danger-muted"
            )}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
