import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PoundSterling,
  ArrowRight,
  CalendarIcon,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "../lib/utils";

import {
  StatCard,
  RevenueChart,
  JobStatusChart,
  WorkloadHeatmap,
  RecentActivityFeed,
  QuickActionsPanel,
} from "../features/dashboard";
import DashboardSkeleton from "./DashboardSkeleton";

const DATE_PRESETS = [
  { label: "Last 7 Days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "This Week", getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last 30 Days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
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

const JobCard = ({ job, customers, sites }) => {
  const customer = customers.find((c) => c.id === job.customer_id);
  const site = sites.find((s) => s.id === job.site_id);

  const priorityColors = {
    urgent: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    low: "bg-muted text-muted-foreground",
  };

  const typeLabels = {
    breakdown: "Breakdown",
    pm_service: "PM Service",
    install: "Install",
    quote_visit: "Quote Visit",
  };

  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <div
        className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
        data-testid={`job-card-${job.id}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-2 rounded-lg",
              job.priority === "urgent"
                ? "bg-destructive/10 dark:bg-destructive/20"
                : "bg-primary/10"
            )}
          >
            <Wrench
              className={cn(
                "h-5 w-5",
                job.priority === "urgent" ? "text-destructive" : "text-primary"
              )}
            />
          </div>
          <div>
            <p className="font-medium text-foreground mono text-sm">{job.job_number}</p>
            <p className="text-sm text-muted-foreground">{customer?.company_name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground/70">{site?.address || "No site"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
          <Badge variant="outline">{typeLabels[job.job_type] || job.job_type}</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
};

const PMDueCard = ({ asset, site }) => (
  <div
    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
    data-testid={`pm-due-${asset.id}`}
  >
    <div className="flex items-center gap-3">
      <Thermometer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="font-medium text-foreground text-sm">{asset.name}</p>
        <p className="text-xs text-muted-foreground">{site?.name || "Unknown site"}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">PM Due</p>
      <p className="text-xs text-muted-foreground">{asset.next_pm_due?.split("T")[0] || "N/A"}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [pmDueAssets, setPmDueAssets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  }));
  const [previousStats, setPreviousStats] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, jobsRes, pmRes, customersRes, sitesRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/jobs?status=pending"),
        api.get("/reports/pm-due-list"),
        api.get("/customers"),
        api.get("/sites"),
      ]);
      
      if (stats) {
        setPreviousStats(stats);
      }
      
      setStats(statsRes.data);
      setJobs(jobsRes.data.slice(0, 5));
      setPmDueAssets(pmRes.data.slice(0, 5));
      setCustomers(customersRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return { trend: "neutral", value: "No data" };
    const diff = current - previous;
    const percentage = Math.round((diff / previous) * 100);
    if (diff > 0) return { trend: "up", value: `+${percentage}% vs last period` };
    if (diff < 0) return { trend: "down", value: `${percentage}% vs last period` };
    return { trend: "neutral", value: "No change" };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const pendingTrend = getTrend(stats?.pending_jobs, previousStats?.pending_jobs);
  const completedTrend = getTrend(stats?.completed_this_week, previousStats?.completed_this_week);

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground heading">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Urgent Alert */}
      {stats?.urgent_jobs > 0 && (
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10" data-testid="urgent-alert">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">
                  {stats.urgent_jobs} Urgent Job{stats.urgent_jobs > 1 ? "s" : ""} Require Attention
                </p>
                <p className="text-sm text-destructive/80">
                  High priority breakdowns need immediate action
                </p>
              </div>
              <Link to="/jobs?priority=urgent">
                <Button variant="destructive" size="sm" data-testid="view-urgent-btn">
                  View Urgent Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Section - Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Jobs"
          value={stats?.pending_jobs || 0}
          icon={Clock}
          iconColor="bg-amber-500"
          trend={pendingTrend.trend}
          trendValue={pendingTrend.value}
          data-testid="stat-pending-jobs"
        />
        <StatCard
          title="In Progress"
          value={stats?.in_progress_jobs || 0}
          icon={Wrench}
          iconColor="bg-primary"
          data-testid="stat-in-progress"
        />
        <StatCard
          title="Completed This Week"
          value={stats?.completed_this_week || 0}
          icon={CheckCircle2}
          iconColor="bg-emerald-500"
          trend={completedTrend.trend}
          trendValue={completedTrend.value}
          data-testid="stat-completed-this-week"
        />
        <StatCard
          title="Outstanding"
          value={`£${(stats?.outstanding_amount || 0).toLocaleString()}`}
          icon={PoundSterling}
          iconColor="bg-slate-700 dark:bg-slate-600"
          description="Unpaid invoices"
          data-testid="stat-outstanding"
        />
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Trend Section - Revenue Chart */}
        <div className="lg:col-span-8">
          <RevenueChart dateRange={dateRange} />
        </div>

        {/* Job Status Chart */}
        <div className="lg:col-span-4">
          <JobStatusChart />
        </div>

        {/* Workload Heatmap */}
        <div className="lg:col-span-8">
          <WorkloadHeatmap dateRange={dateRange} />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4">
          <QuickActionsPanel />
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg heading">Recent Pending Jobs</CardTitle>
              <Link to="/jobs">
                <Button variant="ghost" size="sm" className="text-primary" data-testid="view-all-jobs-btn">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <JobCard key={job.id} job={job} customers={customers} sites={sites} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending jobs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4">
          <RecentActivityFeed />
        </div>

        {/* PM Due Section */}
        <div className="lg:col-span-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg heading">PM Due</CardTitle>
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                {pmDueAssets.length} due
              </Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {pmDueAssets.length > 0 ? (
                    pmDueAssets.map((asset) => (
                      <PMDueCard key={asset.id} asset={asset} site={asset.site} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No PM due</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg heading">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats?.total_customers || 0}</p>
                  <p className="text-sm text-muted-foreground">Customers</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats?.total_assets || 0}</p>
                  <p className="text-sm text-muted-foreground">Assets</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats?.total_jobs || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats?.pm_due || 0}</p>
                  <p className="text-sm text-muted-foreground">PM Due</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
