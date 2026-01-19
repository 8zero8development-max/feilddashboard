import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Wrench,
  Thermometer,
  CalendarIcon,
  RefreshCw,
  Download,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "../lib/utils";
import { useReportsData } from "../hooks/useReportsData";
import { StatCard, JobStatusChart, RevenueChart } from "../features/dashboard";

const DATE_PRESETS = [
  { label: "Last 7 Days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "This Week", getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last 30 Days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Last 90 Days", getValue: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
];

const DateRangePicker = ({ dateRange, onDateRangeChange }) => {
  const [open, setOpen] = useState(false);

  const handlePresetClick = (preset) => {
    onDateRangeChange(preset.getValue());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-[280px]",
            !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r border-border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Presets</p>
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const StatCardSkeleton = () => (
  <Card className="bg-card/80 backdrop-blur-sm border-border">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </CardContent>
  </Card>
);

const ChartCardSkeleton = ({ height = "h-[300px]" }) => (
  <Card className="bg-card/80 backdrop-blur-sm border-border">
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className={`w-full ${height}`} />
    </CardContent>
  </Card>
);

const PMDueItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-5" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="text-right space-y-1">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

const AnalyticsHubSkeleton = () => (
  <div className="space-y-6" data-testid="analytics-hub-skeleton">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <ChartCardSkeleton height="h-[350px]" />
      </div>
      <div className="lg:col-span-4">
        <ChartCardSkeleton height="h-[350px]" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <ChartCardSkeleton height="h-[300px]" />
      </div>
      <div className="lg:col-span-4">
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <PMDueItemSkeleton />
            <PMDueItemSkeleton />
            <PMDueItemSkeleton />
            <PMDueItemSkeleton />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const EngineerBarChart = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.engineer_name,
    jobs: item.count,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No engineer data available</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis
          dataKey="name"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const Reports = () => {
  const [dateRange, setDateRange] = useState(() => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  }));

  const { data, loading, refetch } = useReportsData(dateRange);
  const { stats, jobsByEngineer, pmDueList } = data;

  const handleExportCSV = useCallback(() => {
    toast.info("Export functionality coming soon!");
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Data refreshed");
  }, [refetch]);

  if (loading) {
    return <AnalyticsHubSkeleton />;
  }

  return (
    <div className="space-y-6" data-testid="analytics-hub">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground heading">Analytics Hub</h1>
          <p className="text-muted-foreground text-sm">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats?.total_jobs || 0}
          icon={Wrench}
          iconColor="bg-primary"
          trend="up"
          trendValue="+12% vs last period"
          data-testid="stat-total-jobs"
        />
        <StatCard
          title="Completed This Week"
          value={stats?.completed_this_week || 0}
          icon={CheckCircle2}
          iconColor="bg-emerald-500"
          trend="up"
          trendValue="+5% vs last period"
          data-testid="stat-completed-this-week"
        />
        <StatCard
          title="Total Customers"
          value={stats?.total_customers || 0}
          icon={Users}
          iconColor="bg-blue-500"
          data-testid="stat-total-customers"
        />
        <StatCard
          title="Assets Tracked"
          value={stats?.total_assets || 0}
          icon={Thermometer}
          iconColor="bg-purple-500"
          data-testid="stat-total-assets"
        />
      </div>

      {/* Charts Grid - Bento Box Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Chart - 2/3 width */}
        <div className="lg:col-span-8">
          <RevenueChart dateRange={dateRange} />
        </div>

        {/* Job Status Chart - 1/3 width */}
        <div className="lg:col-span-4">
          <JobStatusChart />
        </div>
      </div>

      {/* Second Row - Engineer Performance & PM Due */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Jobs by Engineer */}
        <div className="lg:col-span-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg heading flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Jobs by Engineer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EngineerBarChart data={jobsByEngineer} />
            </CardContent>
          </Card>
        </div>

        {/* PM Due List */}
        <div className="lg:col-span-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg heading flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-amber-600" />
                PM Due List
              </CardTitle>
              {pmDueList.length > 0 && (
                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                  {pmDueList.length} due
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {pmDueList.length > 0 ? (
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {pmDueList.slice(0, 8).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                      data-testid={`pm-due-item-${asset.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Thermometer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.site?.name || "Unknown site"} {asset.make && `• ${asset.make}`} {asset.model && asset.model}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs">
                          PM Due
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {asset.next_pm_due?.split("T")[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No PM currently due</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.pending_jobs || 0}</p>
            <p className="text-sm text-muted-foreground">Pending Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="p-4 text-center">
            <Wrench className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.in_progress_jobs || 0}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.urgent_jobs || 0}</p>
            <p className="text-sm text-muted-foreground">Urgent Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="p-4 text-center">
            <Thermometer className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.pm_due || 0}</p>
            <p className="text-sm text-muted-foreground">PM Due</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
