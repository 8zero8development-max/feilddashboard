import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Search, Filter, Wrench, Eye, Calendar, User } from "lucide-react";

const priorityColors = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-blue-100 text-blue-800",
  low: "bg-slate-100 text-slate-700",
};

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  travelling: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
};

const Jobs = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [assets, setAssets] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    priority: searchParams.get("priority") || "",
    engineer_id: searchParams.get("engineer_id") || "",
    job_type: searchParams.get("job_type") || "",
  });

  const [form, setForm] = useState({
    customer_id: "",
    site_id: "",
    asset_ids: [],
    job_type: "breakdown",
    priority: "medium",
    description: "",
    assigned_engineer_id: "",
    scheduled_date: "",
    scheduled_time: "",
    estimated_duration: 60,
    sla_hours: null,
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const [jobsRes, customersRes, sitesRes, assetsRes, engineersRes] = await Promise.all([
        api.get(`/jobs?${params.toString()}`),
        api.get("/customers"),
        api.get("/sites"),
        api.get("/assets"),
        api.get("/users/engineers"),
      ]);

      setJobs(jobsRes.data);
      setCustomers(customersRes.data);
      setSites(sitesRes.data);
      setAssets(assetsRes.data);
      setEngineers(engineersRes.data);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ status: "", priority: "", engineer_id: "", job_type: "" });
    setSearchParams({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        sla_hours: form.sla_hours ? parseInt(form.sla_hours) : null,
        assigned_engineer_id: form.assigned_engineer_id || null,
      };
      await api.post("/jobs", data);
      toast.success("Job created successfully");
      setDialogOpen(false);
      setForm({
        customer_id: "",
        site_id: "",
        asset_ids: [],
        job_type: "breakdown",
        priority: "medium",
        description: "",
        assigned_engineer_id: "",
        scheduled_date: "",
        scheduled_time: "",
        estimated_duration: 60,
        sla_hours: null,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create job");
    }
  };

  const filteredSites = sites.filter((s) => s.customer_id === form.customer_id);
  const filteredAssets = assets.filter((a) => a.site_id === form.site_id);

  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true;
    const customer = customers.find((c) => c.id === job.customer_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      job.job_number?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      customer?.company_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6" data-testid="jobs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">Jobs</h1>
          <p className="text-slate-500 text-sm">Manage work orders and call-outs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="create-job-btn">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="heading">Create New Job</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select
                    value={form.customer_id}
                    onValueChange={(v) => setForm({ ...form, customer_id: v, site_id: "", asset_ids: [] })}
                  >
                    <SelectTrigger data-testid="job-customer-select">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Site *</Label>
                  <Select
                    value={form.site_id}
                    onValueChange={(v) => setForm({ ...form, site_id: v, asset_ids: [] })}
                    disabled={!form.customer_id}
                  >
                    <SelectTrigger data-testid="job-site-select">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSites.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Type *</Label>
                  <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v })}>
                    <SelectTrigger data-testid="job-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakdown">Breakdown</SelectItem>
                      <SelectItem value="pm_service">PM Service</SelectItem>
                      <SelectItem value="install">Install</SelectItem>
                      <SelectItem value="quote_visit">Quote Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger data-testid="job-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredAssets.length > 0 && (
                <div className="space-y-2">
                  <Label>Assets (optional)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {filteredAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center gap-2">
                        <Checkbox
                          id={asset.id}
                          checked={form.asset_ids.includes(asset.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForm({ ...form, asset_ids: [...form.asset_ids, asset.id] });
                            } else {
                              setForm({ ...form, asset_ids: form.asset_ids.filter((id) => id !== asset.id) });
                            }
                          }}
                        />
                        <label htmlFor={asset.id} className="text-sm">{asset.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the job..."
                  required
                  data-testid="job-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assign Engineer</Label>
                  <Select
                    value={form.assigned_engineer_id}
                    onValueChange={(v) => setForm({ ...form, assigned_engineer_id: v })}
                  >
                    <SelectTrigger data-testid="job-engineer-select">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {engineers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SLA (hours)</Label>
                  <Input
                    type="number"
                    value={form.sla_hours || ""}
                    onChange={(e) => setForm({ ...form, sla_hours: e.target.value })}
                    placeholder="e.g., 4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    data-testid="job-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    value={form.estimated_duration}
                    onChange={(e) => setForm({ ...form, estimated_duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="submit-job-btn">
                  Create Job
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-slate-500 mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="job-search-input"
                />
              </div>
            </div>
            <div className="w-40">
              <Label className="text-xs text-slate-500 mb-1 block">Status</Label>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-slate-500 mb-1 block">Priority</Label>
              <Select value={filters.priority} onValueChange={(v) => handleFilterChange("priority", v)}>
                <SelectTrigger data-testid="filter-priority">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-slate-500 mb-1 block">Type</Label>
              <Select value={filters.job_type} onValueChange={(v) => handleFilterChange("job_type", v)}>
                <SelectTrigger data-testid="filter-type">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="pm_service">PM Service</SelectItem>
                  <SelectItem value="install">Install</SelectItem>
                  <SelectItem value="quote_visit">Quote Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filters.status || filters.priority || filters.job_type) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wrench className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No jobs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => {
                  const customer = customers.find((c) => c.id === job.customer_id);
                  const engineer = engineers.find((e) => e.id === job.assigned_engineer_id);
                  return (
                    <TableRow key={job.id} className="table-row-hover cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)} data-testid={`job-row-${job.id}`}>
                      <TableCell className="font-medium mono text-sm">{job.job_number}</TableCell>
                      <TableCell>{customer?.company_name || "Unknown"}</TableCell>
                      <TableCell className="capitalize">{job.job_type?.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[job.status]}>{job.status?.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {engineer ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{engineer.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.scheduled_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{job.scheduled_date}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" data-testid={`view-job-${job.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Jobs;
