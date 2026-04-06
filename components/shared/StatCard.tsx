import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Trend = { value: number; direction: "up" | "down" };

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: Trend;
  color?: "blue" | "green" | "amber" | "red" | "purple" | "indigo";
  className?: string;
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  red: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "blue",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trend.direction === "up" ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
                <span className="text-muted-foreground font-normal">vs last month</span>
              </p>
            )}
            {description && !trend && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
