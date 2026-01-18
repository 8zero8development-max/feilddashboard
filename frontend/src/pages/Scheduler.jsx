import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../App";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../components/ui/resizable";
import { ScrollArea } from "../components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/ui/hover-card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Search,
  Filter,
  Wrench,
  AlertCircle,
  CheckCircle,
  Loader2,
  GripVertical,
  Users,
} from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const ITEM_TYPES = {
  JOB_CARD: "JOB_CARD",
};

const priorityColors = {
  urgent: { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" },
  high: { bg: "#fff7ed", border: "#f97316", text: "#ea580c" },
  medium: { bg: "#eff6ff", border: "#3b82f6", text: "#2563eb" },
  low: { bg: "#f8fafc", border: "#64748b", text: "#475569" },
};

const statusColors = {
  completed: { bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle },
  in_progress: { bg: "bg-amber-100", text: "text-amber-800", icon: Loader2 },
  travelling: { bg: "bg-blue-100", text: "text-blue-800", icon: MapPin },
  pending: { bg: "bg-slate-100", text: "text-slate-800", icon: Clock },
  cancelled: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
};

const jobTypeIcons = {
  breakdown: AlertCircle,
  pm_service: Wrench,
  install: Wrench,
  quote_visit: CalendarIcon,
};

const useScheduledJobs = (refreshTrigger) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get("/jobs/scheduled");
      setJobs(response.data);
    } catch (error) {
      toast.error("Failed to load scheduled jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  return { jobs, loading, refetch: fetchJobs };
};

const useUnscheduledJobs = (refreshTrigger) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get("/jobs");
      const unscheduled = response.data.filter(
        (job) => !job.scheduled_date || !job.assigned_engineer_id || job.status === "pending"
      );
      setJobs(unscheduled);
    } catch (error) {
      toast.error("Failed to load unscheduled jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  return { jobs, loading, refetch: fetchJobs };
};

const useResources = () => {
  const [engineers, setEngineers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    try {
      const [engineersRes, customersRes, sitesRes] = await Promise.all([
        api.get("/users/engineers"),
        api.get("/customers"),
        api.get("/sites"),
      ]);
      setEngineers(engineersRes.data);
      setCustomers(customersRes.data);
      setSites(sitesRes.data);
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return { engineers, customers, sites, loading, refetch: fetchResources };
};

const DraggableJobCard = ({ job, customer, site, onSelect }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPES.JOB_CARD,
    item: { job },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const priority = job.priority || "medium";
  const colors = priorityColors[priority];
  const JobTypeIcon = jobTypeIcons[job.job_type] || Wrench;
  const StatusConfig = statusColors[job.status] || statusColors.pending;
  const StatusIcon = StatusConfig.icon;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          ref={drag}
          onClick={() => onSelect(job)}
          className={`
            p-3 rounded-lg border-l-4 cursor-grab active:cursor-grabbing
            transition-all duration-200 hover:shadow-md
            ${isDragging ? "opacity-50 scale-95" : "opacity-100"}
          `}
          style={{
            backgroundColor: colors.bg,
            borderLeftColor: colors.border,
          }}
          data-testid={`parking-lot-job-${job.id}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900 truncate">
                  {job.job_number}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  {priority}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 truncate mt-1">
                {customer?.company_name || "Unknown Customer"}
              </p>
              {site && (
                <p className="text-xs text-slate-500 truncate">
                  {site.name}
                </p>
              )}
            </div>
            <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <JobTypeIcon className="h-3 w-3 text-slate-500" />
            <span className="text-xs text-slate-500 capitalize">
              {job.job_type?.replace("_", " ")}
            </span>
            <Badge className={`${StatusConfig.bg} ${StatusConfig.text} text-xs px-1.5 py-0 ml-auto`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {job.status?.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="right">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-slate-900">{job.job_number}</h4>
            <p className="text-sm text-slate-600">{customer?.company_name}</p>
          </div>
          {site && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{site.name}</p>
                <p className="text-xs text-slate-500">{site.address}</p>
              </div>
            </div>
          )}
          {job.description && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Description</p>
              <p className="text-sm text-slate-700 line-clamp-3">{job.description}</p>
            </div>
          )}
          {job.sla_hours && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>SLA: {job.sla_hours} hours</span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Badge style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }} variant="outline">
              {priority} priority
            </Badge>
            <Badge variant="outline" className="capitalize">
              {job.job_type?.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const UnscheduledSidebar = ({ jobs, customers, sites, loading, onSelectJob, searchTerm, setSearchTerm, filterPriority, setFilterPriority }) => {
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const customer = customers.find((c) => c.id === job.customer_id);
      const matchesSearch =
        !searchTerm ||
        job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = !filterPriority || filterPriority === "all" || job.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [jobs, customers, searchTerm, filterPriority]);

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-5 w-5 text-cyan-600" />
          <h2 className="font-semibold text-slate-900">Parking Lot</h2>
          <Badge variant="secondary" className="ml-auto">
            {filteredJobs.length}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
              data-testid="parking-lot-search"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9" data-testid="parking-lot-filter">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No unscheduled jobs</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <DraggableJobCard
                key={job.id}
                job={job}
                customer={customers.find((c) => c.id === job.customer_id)}
                site={sites.find((s) => s.id === job.site_id)}
                onSelect={onSelectJob}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const CustomEventComponent = ({ event, customers, sites }) => {
  const job = event.resource;
  const priority = job?.priority || "medium";
  const colors = priorityColors[priority];
  const customer = customers.find((c) => c.id === job?.customer_id);
  const site = sites.find((s) => s.id === job?.site_id);
  const JobTypeIcon = jobTypeIcons[job?.job_type] || Wrench;
  const StatusConfig = statusColors[job?.status] || statusColors.pending;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className="h-full w-full p-1 overflow-hidden cursor-pointer"
          style={{
            backgroundColor: colors.bg,
            borderLeft: `3px solid ${colors.border}`,
            borderRadius: "4px",
          }}
          data-testid={`calendar-event-${job?.id}`}
        >
          <div className="flex items-center gap-1">
            <span className="font-semibold text-xs truncate" style={{ color: colors.text }}>
              {job?.job_number}
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">{customer?.company_name}</p>
          {site && <p className="text-xs text-slate-500 truncate">{site.name}</p>}
          <div className="flex items-center gap-1 mt-0.5">
            <JobTypeIcon className="h-3 w-3 text-slate-500" />
            <Badge className={`${StatusConfig.bg} ${StatusConfig.text} text-[10px] px-1 py-0`}>
              {job?.status?.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-72" side="right">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{job?.job_number}</h4>
              <p className="text-sm text-slate-600">{customer?.company_name}</p>
            </div>
            <Badge style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }} variant="outline">
              {priority}
            </Badge>
          </div>
          {site && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium">{site.name}</p>
                <p className="text-xs text-slate-500">{site.address}</p>
              </div>
            </div>
          )}
          {job?.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>{job?.scheduled_date} {job?.scheduled_time}</span>
          </div>
          {event.engineer && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              <span>{event.engineer}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const ResourceHeader = ({ engineer }) => {
  const initials = engineer.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div className="flex items-center gap-2 p-2 min-w-[150px]">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{engineer.name}</p>
        <p className="text-xs text-slate-500 truncate">{engineer.email}</p>
      </div>
    </div>
  );
};

const CalendarDropZone = ({ children, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPES.JOB_CARD,
    drop: (item, monitor) => {
      onDrop(item.job);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`h-full w-full ${isOver && canDrop ? "ring-2 ring-cyan-400 ring-inset bg-cyan-50/50" : ""}`}
    >
      {children}
    </div>
  );
};

const CustomToolbar = ({ label, onNavigate, onView, view, showResourceView, setShowResourceView }) => (
  <div className="flex items-center justify-between mb-4 p-2 flex-wrap gap-2">
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onNavigate("PREV")} data-testid="calendar-prev">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => onNavigate("NEXT")} data-testid="calendar-next">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={() => onNavigate("TODAY")} data-testid="calendar-today">
        Today
      </Button>
      <span className="text-lg font-semibold text-slate-900 ml-4">{label}</span>
    </div>
    <div className="flex gap-2">
      <Button
        variant={showResourceView ? "default" : "outline"}
        size="sm"
        onClick={() => setShowResourceView(!showResourceView)}
        className={showResourceView ? "bg-cyan-600 hover:bg-cyan-700" : ""}
        data-testid="view-resource"
      >
        <Users className="h-4 w-4 mr-1" />
        Resources
      </Button>
      <Button
        variant={view === "day" ? "default" : "outline"}
        size="sm"
        onClick={() => onView("day")}
        className={view === "day" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
        data-testid="view-day"
      >
        Day
      </Button>
      <Button
        variant={view === "week" ? "default" : "outline"}
        size="sm"
        onClick={() => onView("week")}
        className={view === "week" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
        data-testid="view-week"
      >
        Week
      </Button>
      <Button
        variant={view === "month" ? "default" : "outline"}
        size="sm"
        onClick={() => onView("month")}
        className={view === "month" ? "bg-cyan-600 hover:bg-cyan-700" : ""}
        data-testid="view-month"
      >
        Month
      </Button>
    </div>
  </div>
);

const Scheduler = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());
  const [showResourceView, setShowResourceView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");

  const { jobs: scheduledJobs, loading: scheduledLoading } = useScheduledJobs(refreshTrigger);
  const { jobs: unscheduledJobs, loading: unscheduledLoading } = useUnscheduledJobs(refreshTrigger);
  const { engineers, customers, sites, loading: resourcesLoading } = useResources();

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const events = useMemo(() => {
    return scheduledJobs
      .filter((job) => job.scheduled_date)
      .map((job) => {
        const customer = customers.find((c) => c.id === job.customer_id);
        const engineer = engineers.find((e) => e.id === job.assigned_engineer_id);
        const startDate = new Date(job.scheduled_date);
        if (job.scheduled_time) {
          const [hours, minutes] = job.scheduled_time.split(":");
          startDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
          startDate.setHours(9, 0);
        }
        const endDate = new Date(startDate.getTime() + (job.estimated_duration || 60) * 60000);

        return {
          id: job.id,
          title: `${job.job_number} - ${customer?.company_name || "Unknown"}`,
          start: startDate,
          end: endDate,
          resource: job,
          engineer: engineer?.name,
          resourceId: job.assigned_engineer_id,
        };
      });
  }, [scheduledJobs, customers, engineers]);

  const resourceMap = useMemo(() => {
    return engineers.map((engineer) => ({
      resourceId: engineer.id,
      resourceTitle: engineer.name,
      engineer,
    }));
  }, [engineers]);

  const handleSelectEvent = (event) => {
    setSelectedJob(event.resource);
    setDialogOpen(true);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleDropOnCalendar = async (job) => {
    try {
      const scheduledDate = moment(date).format("YYYY-MM-DD");
      const scheduledTime = "09:00";
      
      await api.put(`/jobs/${job.id}`, {
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      });
      toast.success(`Job ${job.job_number} scheduled for ${scheduledDate}`);
      triggerRefresh();
    } catch (error) {
      toast.error("Failed to schedule job");
    }
  };

  const updateJobEngineer = async (jobId, engineerId) => {
    try {
      await api.put(`/jobs/${jobId}`, { assigned_engineer_id: engineerId || null });
      toast.success("Engineer updated");
      triggerRefresh();
    } catch (error) {
      toast.error("Failed to update engineer");
    }
  };

  const eventStyleGetter = (event) => {
    const priority = event.resource?.priority || "medium";
    const colors = priorityColors[priority];
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: "4px",
        color: colors.text,
        fontSize: "12px",
        padding: "2px",
        border: "none",
      },
    };
  };

  const loading = scheduledLoading || unscheduledLoading || resourcesLoading;

  if (loading && scheduledJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const site = selectedJob ? sites.find((s) => s.id === selectedJob.site_id) : null;
  const customer = selectedJob ? customers.find((c) => c.id === selectedJob.customer_id) : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="scheduler-page">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 heading">Mission Control</h1>
          <p className="text-slate-500 text-sm">Drag jobs from the parking lot to schedule them on the calendar</p>
        </div>

        <div className="flex items-center gap-4 text-sm mb-4">
          <span className="text-slate-500">Priority:</span>
          {Object.entries(priorityColors).map(([priority, colors]) => (
            <div key={priority} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              ></div>
              <span className="capitalize">{priority}</span>
            </div>
          ))}
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <UnscheduledSidebar
              jobs={unscheduledJobs}
              customers={customers}
              sites={sites}
              loading={unscheduledLoading}
              onSelectJob={(job) => {
                setSelectedJob(job);
                setDialogOpen(true);
              }}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={75}>
            <Card className="h-full border-0 rounded-none">
              <CardContent className="p-4 h-full">
                <CalendarDropZone onDrop={handleDropOnCalendar}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    views={["month", "week", "day"]}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={handleNavigate}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    selectable
                    resources={showResourceView ? resourceMap : undefined}
                    resourceIdAccessor="resourceId"
                    resourceTitleAccessor="resourceTitle"
                    components={{
                      toolbar: (props) => (
                        <CustomToolbar
                          {...props}
                          showResourceView={showResourceView}
                          setShowResourceView={setShowResourceView}
                        />
                      ),
                      event: (props) => (
                        <CustomEventComponent
                          {...props}
                          customers={customers}
                          sites={sites}
                        />
                      ),
                      resourceHeader: ({ resource }) => (
                        <ResourceHeader engineer={resource.engineer} />
                      ),
                    }}
                    data-testid="calendar"
                  />
                </CalendarDropZone>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="heading flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-cyan-600" />
                {selectedJob?.job_number}
              </DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="font-medium">{customer?.company_name}</p>
                </div>
                {site && (
                  <div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Site
                    </p>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-slate-600">{site.address}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Date & Time
                    </p>
                    <p className="font-medium">{selectedJob.scheduled_date || "Not scheduled"}</p>
                    {selectedJob.scheduled_time && <p className="text-sm">{selectedJob.scheduled_time}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Duration</p>
                    <p className="font-medium">{selectedJob.estimated_duration || 60} mins</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-slate-700">{selectedJob.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={
                      selectedJob.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : selectedJob.priority === "high"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {selectedJob.priority}
                  </Badge>
                  <Badge variant="outline">{selectedJob.job_type?.replace("_", " ")}</Badge>
                  <Badge
                    className={
                      selectedJob.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {selectedJob.status?.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                    <User className="h-3 w-3" /> Assigned Engineer
                  </p>
                  <Select
                    value={selectedJob.assigned_engineer_id || "unassigned"}
                    onValueChange={(v) => updateJobEngineer(selectedJob.id, v === "unassigned" ? null : v)}
                  >
                    <SelectTrigger data-testid="scheduler-engineer-select">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {engineers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/jobs/${selectedJob.id}`, "_blank")}
                    data-testid="view-job-detail-btn"
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
};

export default Scheduler;
