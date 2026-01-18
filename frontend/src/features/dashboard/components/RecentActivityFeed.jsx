import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../App";
import { Activity, CheckCircle2, Clock, Wrench, AlertTriangle, Truck } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "../../../lib/utils";

const EVENT_CONFIG = {
  created: {
    icon: Clock,
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    label: "Job Created",
  },
  status_changed: {
    icon: Wrench,
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
    label: "Status Changed",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    label: "Job Completed",
  },
  auto_generated: {
    icon: AlertTriangle,
    color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
    label: "PM Auto-Generated",
  },
  travelling: {
    icon: Truck,
    color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30",
    label: "Engineer Travelling",
  },
};

const ActivityItem = ({ event, jobs }) => {
  const config = EVENT_CONFIG[event.event_type] || {
    icon: Activity,
    color: "text-slate-500 bg-slate-100 dark:bg-slate-800",
    label: event.event_type,
  };
  const Icon = config.icon;
  const job = jobs.find((j) => j.id === event.job_id);

  const getEventDescription = () => {
    switch (event.event_type) {
      case "created":
        return `New job created`;
      case "status_changed":
        return `Status: ${event.details?.old_status || "unknown"} → ${event.details?.new_status || "unknown"}`;
      case "completed":
        return `Completed in ${event.details?.time_on_site || 0} mins`;
      case "auto_generated":
        return "PM job auto-generated";
      default:
        return config.label;
    }
  };

  return (
    <Link
      to={`/jobs/${event.job_id}`}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={cn("p-2 rounded-full", config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {job?.job_number || "Unknown Job"}
        </p>
        <p className="text-xs text-muted-foreground">{getEventDescription()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
};

const ActivityItemSkeleton = () => (
  <div className="flex items-start gap-3 p-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const RecentActivityFeed = () => {
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const [jobsRes] = await Promise.all([api.get("/jobs")]);
      const allJobs = jobsRes.data;
      setJobs(allJobs);

      const recentJobIds = allJobs.slice(0, 20).map((j) => j.id);
      const eventPromises = recentJobIds.map((id) =>
        api.get(`/jobs/${id}/events`).catch(() => ({ data: [] }))
      );
      const eventResponses = await Promise.all(eventPromises);

      const allEvents = eventResponses
        .flatMap((res) => res.data)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15);

      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to fetch activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg heading flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-4">
          {events.length > 0 ? (
            <div className="space-y-1 pb-4">
              {events.map((event) => (
                <ActivityItem key={event.id} event={event} jobs={jobs} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Activity className="h-12 w-12 mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
