import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Thermometer,
  PoundSterling,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

const StatCard = ({ title, value, icon: Icon, color, description }) => (
  <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const JobCard = ({ job, customers, sites }) => {
  const customer = customers.find((c) => c.id === job.customer_id);
  const site = sites.find((s) => s.id === job.site_id);

  const priorityColors = {
    urgent: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-blue-100 text-blue-800",
    low: "bg-slate-100 text-slate-700",
  };

  const typeLabels = {
    breakdown: "Breakdown",
    pm_service: "PM Service",
    install: "Install",
    quote_visit: "Quote Visit",
  };

  return (
    <Link to={`/jobs/${job.id}`} className="block">
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-cyan-300 hover:shadow-sm transition-all" data-testid={`job-card-${job.id}`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${job.priority === "urgent" ? "bg-red-100" : "bg-cyan-100"}`}>
            <Wrench className={`h-5 w-5 ${job.priority === "urgent" ? "text-red-600" : "text-cyan-600"}`} />
          </div>
          <div>
            <p className="font-medium text-slate-900 mono text-sm">{job.job_number}</p>
            <p className="text-sm text-slate-600">{customer?.company_name || "Unknown"}</p>
            <p className="text-xs text-slate-400">{site?.address || "No site"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
          <Badge variant="outline">{typeLabels[job.job_type] || job.job_type}</Badge>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </Link>
  );
};

const PMDueCard = ({ asset, site }) => (
  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200" data-testid={`pm-due-${asset.id}`}>
    <div className="flex items-center gap-3">
      <Thermometer className="h-5 w-5 text-amber-600" />
      <div>
        <p className="font-medium text-slate-900 text-sm">{asset.name}</p>
        <p className="text-xs text-slate-500">{site?.name || "Unknown site"}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs text-amber-700 font-medium">PM Due</p>
      <p className="text-xs text-slate-500">{asset.next_pm_due?.split("T")[0] || "N/A"}</p>
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, pmRes, customersRes, sitesRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/jobs?status=pending"),
        api.get("/reports/pm-due-list"),
        api.get("/customers"),
        api.get("/sites"),
      ]);
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Jobs"
          value={stats?.pending_jobs || 0}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="In Progress"
          value={stats?.in_progress_jobs || 0}
          icon={Wrench}
          color="bg-cyan-600"
        />
        <StatCard
          title="Completed This Week"
          value={stats?.completed_this_week || 0}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          title="Outstanding"
          value={`£${(stats?.outstanding_amount || 0).toLocaleString()}`}
          icon={PoundSterling}
          color="bg-slate-700"
          description="Unpaid invoices"
        />
      </div>

      {/* Urgent Alert */}
      {stats?.urgent_jobs > 0 && (
        <Card className="border-red-200 bg-red-50" data-testid="urgent-alert">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  {stats.urgent_jobs} Urgent Job{stats.urgent_jobs > 1 ? "s" : ""} Require Attention
                </p>
                <p className="text-sm text-red-600">High priority breakdowns need immediate action</p>
              </div>
              <Link to="/jobs?priority=urgent" className="ml-auto">
                <Button variant="destructive" size="sm" data-testid="view-urgent-btn">
                  View Urgent Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg heading">Recent Pending Jobs</CardTitle>
            <Link to="/jobs">
              <Button variant="ghost" size="sm" className="text-cyan-600" data-testid="view-all-jobs-btn">
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
                <div className="text-center py-8 text-slate-500">
                  <Wrench className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No pending jobs</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PM Due Sidebar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg heading">PM Due</CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {pmDueAssets.length} due
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {pmDueAssets.length > 0 ? (
                  pmDueAssets.map((asset) => (
                    <PMDueCard key={asset.id} asset={asset} site={asset.site} />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Thermometer className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No PM due</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats?.total_customers || 0}</p>
            <p className="text-sm text-slate-500">Customers</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <Thermometer className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats?.total_assets || 0}</p>
            <p className="text-sm text-slate-500">Assets</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <Wrench className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats?.total_jobs || 0}</p>
            <p className="text-sm text-slate-500">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats?.pm_due || 0}</p>
            <p className="text-sm text-slate-500">PM Due</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
