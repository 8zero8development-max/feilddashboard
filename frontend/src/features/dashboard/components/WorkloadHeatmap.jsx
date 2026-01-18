import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../App";
import { CalendarDays } from "lucide-react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subMonths } from "date-fns";
import { cn } from "../../../lib/utils";

const INTENSITY_COLORS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-900/50",
  "bg-emerald-300 dark:bg-emerald-800/60",
  "bg-emerald-400 dark:bg-emerald-700/70",
  "bg-emerald-500 dark:bg-emerald-600/80",
  "bg-emerald-600 dark:bg-emerald-500",
];

const getIntensityLevel = (count, maxCount) => {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.6) return 3;
  if (ratio <= 0.8) return 4;
  return 5;
};

const WorkloadHeatmap = ({ dateRange }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    fetchWorkloadData();
  }, [dateRange]);

  const fetchWorkloadData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/jobs");
      const jobs = response.data;

      const jobsByDate = {};
      let max = 0;

      jobs.forEach((job) => {
        const date = job.created_at?.split("T")[0];
        if (date) {
          jobsByDate[date] = (jobsByDate[date] || 0) + 1;
          if (jobsByDate[date] > max) {
            max = jobsByDate[date];
          }
        }
      });

      setData(jobsByDate);
      setMaxCount(max);
    } catch (error) {
      console.error("Failed to fetch workload data:", error);
    } finally {
      setLoading(false);
    }
  };

  const months = [];
  const today = new Date();
  for (let i = 2; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(today, i));
    const monthEnd = endOfMonth(subMonths(today, i));
    months.push({
      name: format(monthStart, "MMM"),
      days: eachDayOfInterval({ start: monthStart, end: monthEnd }),
    });
  }

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Workload Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[140px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Workload Heatmap
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {INTENSITY_COLORS.map((color, i) => (
                <div key={i} className={cn("w-3 h-3 rounded-sm", color)} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-x-auto"
          role="img"
          aria-label="Job workload heatmap showing job density over the past 3 months"
        >
          <div className="flex gap-6 min-w-fit">
            {months.map((month) => (
              <div key={month.name} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground mb-1">
                  {month.name}
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getDay(month.days[0]) }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-4 h-4" />
                  ))}
                  {month.days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const count = data[dateStr] || 0;
                    const intensity = getIntensityLevel(count, maxCount);
                    const isHovered = hoveredDay === dateStr;

                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          "w-4 h-4 rounded-sm transition-all cursor-pointer relative",
                          INTENSITY_COLORS[intensity],
                          isHovered && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                        onMouseEnter={() => setHoveredDay(dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={`${format(day, "MMM d, yyyy")}: ${count} jobs`}
                      >
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-popover border border-border rounded-md shadow-lg p-2 whitespace-nowrap">
                            <p className="text-xs font-medium text-foreground">
                              {format(day, "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {count} job{count !== 1 ? "s" : ""} created
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkloadHeatmap;
