import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, API } from "../App";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Thermometer,
  Clock,
  User,
  Calendar,
  FileText,
  Download,
  Trash2,
  AlertTriangle,
  Camera,
  X,
  Image as ImageIcon,
} from "lucide-react";

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

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [site, setSite] = useState(null);
  const [assets, setAssets] = useState([]);
  const [engineer, setEngineer] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [events, setEvents] = useState([]);
  const [completion, setCompletion] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [jobRes, engineersRes, eventsRes, photosRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get("/users/engineers"),
        api.get(`/jobs/${id}/events`),
        api.get(`/jobs/${id}/photos`),
      ]);

      const jobData = jobRes.data;
      setJob(jobData);
      setEngineers(engineersRes.data);
      setEvents(eventsRes.data);
      setPhotos(photosRes.data);

      // Fetch related data
      if (jobData.customer_id) {
        const customerRes = await api.get(`/customers/${jobData.customer_id}`);
        setCustomer(customerRes.data);
      }
      if (jobData.site_id) {
        const siteRes = await api.get(`/sites/${jobData.site_id}`);
        setSite(siteRes.data);
      }
      if (jobData.assigned_engineer_id) {
        const eng = engineersRes.data.find((e) => e.id === jobData.assigned_engineer_id);
        setEngineer(eng);
      }
      if (jobData.asset_ids?.length > 0) {
        const assetsRes = await api.get("/assets");
        setAssets(assetsRes.data.filter((a) => jobData.asset_ids.includes(a.id)));
      }
      if (jobData.status === "completed") {
        try {
          const completionRes = await api.get(`/jobs/${id}/completion`);
          setCompletion(completionRes.data);
        } catch {}
      }
    } catch (error) {
      toast.error("Failed to load job details");
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await api.post(`/jobs/${id}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo uploaded");
      const photosRes = await api.get(`/jobs/${id}/photos`);
      setPhotos(photosRes.data);
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async (photoId) => {
    try {
      await api.delete(`/jobs/${id}/photos/${photoId}`);
      toast.success("Photo deleted");
      setPhotos(photos.filter((p) => p.id !== photoId));
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/jobs/${id}`, { status });
      toast.success(`Job status updated to ${status.replace("_", " ")}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const updateEngineer = async (engineerId) => {
    try {
      await api.put(`/jobs/${id}`, { assigned_engineer_id: engineerId || null });
      toast.success("Engineer updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update engineer");
    }
  };

  const deleteJob = async () => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success("Job deleted");
      navigate("/jobs");
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const downloadPDF = () => {
    const token = localStorage.getItem("token");
    window.open(`${API}/jobs/${id}/pdf?token=${token}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!job) return null;

  const typeLabels = {
    breakdown: "Breakdown",
    pm_service: "PM Service",
    install: "Install",
    quote_visit: "Quote Visit",
  };

  return (
    <div className="space-y-6" data-testid="job-detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")} data-testid="back-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 heading mono">{job.job_number}</h1>
              <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
              <Badge className={statusColors[job.status]}>{job.status?.replace("_", " ")}</Badge>
            </div>
            <p className="text-slate-500 text-sm">{typeLabels[job.job_type]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPDF} data-testid="download-pdf-btn">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="destructive" onClick={deleteJob} data-testid="delete-job-btn">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Priority Alert */}
      {job.priority === "urgent" && job.status !== "completed" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Urgent Priority - Requires immediate attention</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle className="heading">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                <p className="text-slate-900">{job.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Status</h4>
                  <Select value={job.status} onValueChange={updateStatus}>
                    <SelectTrigger className="w-full" data-testid="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="travelling">Travelling</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Assigned Engineer</h4>
                  <Select value={job.assigned_engineer_id || "unassigned"} onValueChange={(v) => updateEngineer(v === "unassigned" ? null : v)}>
                    <SelectTrigger className="w-full" data-testid="engineer-select">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {engineers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {job.sla_hours && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>SLA: {job.sla_hours} hours</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
              <TabsTrigger value="completion">Completion</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {events.length > 0 ? (
                    <div className="space-y-4">
                      {events.map((event, i) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                            {i < events.length - 1 && <div className="w-0.5 h-full bg-slate-200"></div>}
                          </div>
                          <div className="pb-4">
                            <p className="font-medium text-slate-900 capitalize">
                              {event.event_type?.replace("_", " ")}
                            </p>
                            {event.details && (
                              <p className="text-sm text-slate-600">
                                {event.details.old_status && (
                                  <>
                                    {event.details.old_status} → {event.details.new_status}
                                  </>
                                )}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">No events yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {assets.length > 0 ? (
                    <div className="space-y-3">
                      {assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Thermometer className="h-5 w-5 text-cyan-600" />
                            <div>
                              <p className="font-medium text-slate-900">{asset.name}</p>
                              <p className="text-sm text-slate-500">
                                {asset.make} {asset.model} {asset.serial_number && `• S/N: ${asset.serial_number}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">No assets linked to this job</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completion" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {completion ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">Engineer Notes</h4>
                        <p className="text-slate-900">{completion.engineer_notes}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1">Travel Time</h4>
                          <p className="text-slate-900">{completion.travel_time} mins</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1">Time on Site</h4>
                          <p className="text-slate-900">{completion.time_on_site} mins</p>
                        </div>
                      </div>
                      {completion.parts_used?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-2">Parts Used</h4>
                          <div className="space-y-1">
                            {completion.parts_used.map((part, i) => (
                              <p key={i} className="text-sm text-slate-600">
                                • {part.name} x{part.quantity}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-4">Job not yet completed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer ? (
                <div>
                  <p className="font-medium text-slate-900">{customer.company_name}</p>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                  <p className="text-sm text-slate-500">{customer.email}</p>
                </div>
              ) : (
                <p className="text-slate-400">No customer</p>
              )}
            </CardContent>
          </Card>

          {/* Site */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              {site ? (
                <div>
                  <p className="font-medium text-slate-900">{site.name}</p>
                  <p className="text-sm text-slate-500">{site.address}</p>
                  {site.access_notes && (
                    <div className="mt-2 p-2 bg-amber-50 rounded text-sm text-amber-800">
                      <p className="font-medium">Access Notes:</p>
                      <p>{site.access_notes}</p>
                    </div>
                  )}
                  {site.contact_name && (
                    <div className="mt-2 text-sm text-slate-600">
                      <p>Contact: {site.contact_name}</p>
                      {site.contact_phone && <p>{site.contact_phone}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">No site</p>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.scheduled_date ? (
                <div>
                  <p className="font-medium text-slate-900">{job.scheduled_date}</p>
                  {job.scheduled_time && <p className="text-sm text-slate-500">{job.scheduled_time}</p>}
                  <p className="text-sm text-slate-500">Duration: {job.estimated_duration} mins</p>
                </div>
              ) : (
                <p className="text-slate-400">Not scheduled</p>
              )}
            </CardContent>
          </Card>

          {/* Engineer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <User className="h-4 w-4" />
                Engineer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engineer ? (
                <div>
                  <p className="font-medium text-slate-900">{engineer.name}</p>
                  <p className="text-sm text-slate-500">{engineer.email}</p>
                </div>
              ) : (
                <p className="text-slate-400">Unassigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
