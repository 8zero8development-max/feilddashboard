import { Card, CardContent } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const TrendIndicator = ({ trend, trendValue }) => {
  if (!trend || trend === "neutral") {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />
        <span>No change</span>
      </div>
    );
  }

  const isUp = trend === "up";
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>{trendValue}</span>
    </div>
  );
};

const Sparkline = ({ data, color = "hsl(var(--primary))" }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparklineGradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#sparklineGradient-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = "bg-primary",
  description,
  trend,
  trendValue,
  sparklineData,
  sparklineColor,
  className,
  onClick,
  "data-testid": testId,
}) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-card/80 backdrop-blur-sm border-border hover:shadow-lg transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/50",
        className
      )}
      onClick={onClick}
      data-testid={testId}
    >
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {(trend || trendValue) && (
              <TrendIndicator trend={trend} trendValue={trendValue} />
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl", iconColor)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </CardContent>
      {sparklineData && sparklineData.length > 0 && (
        <Sparkline data={sparklineData} color={sparklineColor} />
      )}
    </Card>
  );
};

export default StatCard;
