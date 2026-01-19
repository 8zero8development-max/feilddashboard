import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../App";
import { useAuth } from "../App";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import {
  MapPin,
  Clock,
  Wrench,
  Phone,
  Navigation,
  CheckCircle2,
  Camera,
  ClipboardCheck,
  Package,
  PenTool,
  X,
  ArrowLeft,
  Play,
  Pause,
  Home,
  User,
  LogOut,
  WifiOff,
  Building2,
  Thermometer,
} from "lucide-react";

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-500 text-white",
};

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  travelling: "bg-purple-100 text-purple-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const EngineerMobile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sigCanvas = useRef(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [assets, setAssets] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jobs");
  const [showJobSheet, setShowJobSheet] = useState(false);
  
  // Job Sheet State
  const [engineerNotes, setEngineerNotes] = useState("");
  const [travelTime, setTravelTime] = useState(0);
  const [timeOnSite, setTimeOnSite] = useState(0);
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, description: "Check refrigerant pressure", completed: false },
    { id: 2, description: "Inspect compressor operation", completed: false },
    { id: 3, description: "Clean condenser coils", completed: false },
    { id: 4, description: "Check fan motors", completed: false },
    { id: 5, description: "Test thermostat operation", completed: false },
    { id: 6, description: "Inspect electrical connections", completed: false },
    { id: 7, description: "Check door seals", completed: false },
    { id: 8, description: "Record temperatures", completed: false },
  ]);
  const [partsUsed, setPartsUsed] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, customersRes, sitesRes, assetsRes, partsRes] = await Promise.all([
        api.get("/jobs/my-jobs"),
        api.get("/customers"),
        api.get("/sites"),
        api.get("/assets"),
        api.get("/parts"),
      ]);
      setJobs(jobsRes.data);
      setCustomers(customersRes.data);
      setSites(sitesRes.data);
      setAssets(assetsRes.data);
      setParts(partsRes.data);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await api.put(`/jobs/${jobId}`, { status });
      toast.success(`Job ${status.replace("_", " ")}`);
      fetchData();
      if (selectedJob) {
        setSelectedJob({ ...selectedJob, status });
      }
    } catch (error) {
      toast.error("Failed to update job status");
    }
  };

  const openJob = (job) => {
    setSelectedJob(job);
    setShowJobSheet(true);
    setEngineeerNotes("");
    setTravelTime(0);
    setTimeOnSite(0);
    setPartsUsed([]);
    setPhotos([]);
    setChecklistItems(checklistItems.map((item) => ({ ...item, completed: false })));
  };

  const setEngineeerNotes = setEngineerNotes;

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos([...photos, event.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPart = (part) => {
    const existing = partsUsed.find((p) => p.id === part.id);
    if (existing) {
      setPartsUsed(
        partsUsed.map((p) =>
          p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setPartsUsed([...partsUsed, { ...part, quantity: 1 }]);
    }
  };

  const removePart = (partId) => {
    setPartsUsed(partsUsed.filter((p) => p.id !== partId));
  };

  const toggleChecklist = (id) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleComplete = async () => {
    if (!engineerNotes.trim()) {
      toast.error("Please add engineer notes");
      return;
    }
    setShowSignature(true);
  };

  const submitCompletion = async (signatureData) => {
    try {
      const completionData = {
        job_id: selectedJob.id,
        engineer_notes: engineerNotes,
        travel_time: travelTime,
        time_on_site: timeOnSite,
        parts_used: partsUsed.map((p) => ({ name: p.name, quantity: p.quantity })),
        checklist_items: checklistItems,
        customer_signature: signatureData,
        photos: [],
      };

      await api.post(`/jobs/${selectedJob.id}/complete`, completionData);
      toast.success("Job completed successfully!");
      setShowSignature(false);
      setShowJobSheet(false);
      setSelectedJob(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to complete job");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getCustomer = (customerId) => customers.find((c) => c.id === customerId);
  const getSite = (siteId) => sites.find((s) => s.id === siteId);
  const getJobAssets = (assetIds) => assets.filter((a) => assetIds?.includes(a.id));

  const typeLabels = {
    breakdown: "Breakdown",
    pm_service: "PM Service",
    install: "Install",
    quote_visit: "Quote Visit",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white" data-testid="engineer-mobile">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Offline Mode - Changes will sync when online
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/craven-logo.png"
              alt="Craven"
              className="h-8 w-8"
            />
            <div>
              <p className="font-semibold text-sm">Engineer App</p>
              <p className="text-xs text-slate-400">{user?.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white"
            data-testid="logout-mobile-btn"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {!showJobSheet ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold heading">My Jobs</h1>
              <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                {jobs.length} assigned
              </Badge>
            </div>

            {jobs.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No jobs assigned</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const customer = getCustomer(job.customer_id);
                  const site = getSite(job.site_id);
                  return (
                    <Card
                      key={job.id}
                      className="bg-slate-800 border-slate-700 cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => openJob(job)}
                      data-testid={`mobile-job-card-${job.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-mono text-sm text-cyan-400">{job.job_number}</p>
                            <p className="font-semibold">{customer?.company_name}</p>
                          </div>
                          <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            <span className="truncate">{site?.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span>{job.scheduled_date} {job.scheduled_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                          <Badge variant="outline" className="text-xs">{typeLabels[job.job_type]}</Badge>
                          <Badge className={statusColors[job.status]}>{job.status?.replace("_", " ")}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Job Sheet View */
          <div className="min-h-screen bg-slate-900">
            {/* Job Sheet Header */}
            <div className="sticky top-0 z-40 bg-slate-800 border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowJobSheet(false)}
                  className="text-slate-400"
                  data-testid="back-to-jobs-btn"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <p className="font-mono text-cyan-400">{selectedJob?.job_number}</p>
                  <p className="text-sm text-slate-400">{getCustomer(selectedJob?.customer_id)?.company_name}</p>
                </div>
                <Badge className={priorityColors[selectedJob?.priority]}>{selectedJob?.priority}</Badge>
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800 rounded-none border-b border-slate-700">
                <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">Details</TabsTrigger>
                <TabsTrigger value="checklist" className="data-[state=active]:bg-slate-700">Checklist</TabsTrigger>
                <TabsTrigger value="parts" className="data-[state=active]:bg-slate-700">Parts</TabsTrigger>
                <TabsTrigger value="complete" className="data-[state=active]:bg-slate-700">Complete</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="p-4 space-y-4">
                {/* Status Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={selectedJob?.status === "travelling" ? "default" : "outline"}
                    className={selectedJob?.status === "travelling" ? "bg-purple-600" : ""}
                    onClick={() => updateJobStatus(selectedJob?.id, "travelling")}
                    data-testid="status-travelling-btn"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Travel
                  </Button>
                  <Button
                    variant={selectedJob?.status === "in_progress" ? "default" : "outline"}
                    className={selectedJob?.status === "in_progress" ? "bg-cyan-600" : ""}
                    onClick={() => updateJobStatus(selectedJob?.id, "in_progress")}
                    data-testid="status-progress-btn"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateJobStatus(selectedJob?.id, "pending")}
                    data-testid="status-pause-btn"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                </div>

                {/* Site Info */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Site Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const site = getSite(selectedJob?.site_id);
                      return site ? (
                        <>
                          <p className="font-medium">{site.name}</p>
                          <p className="text-sm text-slate-300">{site.address}</p>
                          {site.access_notes && (
                            <div className="p-3 bg-amber-500/20 rounded-lg text-sm">
                              <p className="font-medium text-amber-400 mb-1">Access Notes:</p>
                              <p className="text-slate-300">{site.access_notes}</p>
                            </div>
                          )}
                          {site.contact_phone && (
                            <a
                              href={`tel:${site.contact_phone}`}
                              className="flex items-center gap-2 p-3 bg-cyan-600/20 rounded-lg text-cyan-400"
                            >
                              <Phone className="h-4 w-4" />
                              Call Site: {site.contact_phone}
                            </a>
                          )}
                        </>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>

                {/* Job Description */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                      <Wrench className="h-4 w-4" /> Job Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-200">{selectedJob?.description}</p>
                  </CardContent>
                </Card>

                {/* Assets */}
                {selectedJob?.asset_ids?.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                        <Thermometer className="h-4 w-4" /> Assets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {getJobAssets(selectedJob?.asset_ids).map((asset) => (
                        <div key={asset.id} className="p-3 bg-slate-700 rounded-lg">
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-slate-400">
                            {asset.make} {asset.model} {asset.serial_number && `• S/N: ${asset.serial_number}`}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="checklist" className="p-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-cyan-400" />
                      PM Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg touch-target"
                          onClick={() => toggleChecklist(item.id)}
                          data-testid={`checklist-item-${item.id}`}
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklist(item.id)}
                            className="h-6 w-6"
                          />
                          <span className={item.completed ? "line-through text-slate-500" : ""}>
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                      <p className="text-sm text-slate-400">
                        {checklistItems.filter((i) => i.completed).length} of {checklistItems.length} completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parts" className="p-4 space-y-4">
                {/* Parts Used */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-cyan-400" />
                      Parts Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {partsUsed.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No parts added</p>
                    ) : (
                      <div className="space-y-2">
                        {partsUsed.map((part) => (
                          <div key={part.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                            <div>
                              <p className="font-medium">{part.name}</p>
                              <p className="text-sm text-slate-400">Qty: {part.quantity}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePart(part.id)}
                              className="text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Parts */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-400">Add Part</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {parts.map((part) => (
                          <Button
                            key={part.id}
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-3"
                            onClick={() => addPart(part)}
                            data-testid={`add-part-${part.id}`}
                          >
                            <div>
                              <p className="font-medium">{part.name}</p>
                              <p className="text-xs text-slate-400">{part.part_number} • £{part.unit_price}</p>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="complete" className="p-4 space-y-4">
                {/* Time Tracking */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-cyan-400" />
                      Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-400">Travel (mins)</Label>
                        <Input
                          type="number"
                          value={travelTime}
                          onChange={(e) => setTravelTime(parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600"
                          data-testid="travel-time-input"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">On Site (mins)</Label>
                        <Input
                          type="number"
                          value={timeOnSite}
                          onChange={(e) => setTimeOnSite(parseInt(e.target.value) || 0)}
                          className="bg-slate-700 border-slate-600"
                          data-testid="onsite-time-input"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Photos */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-cyan-400" />
                      Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotoCapture}
                      />
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </span>
                      </Button>
                    </label>
                  </CardContent>
                </Card>

                {/* Engineer Notes */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5 text-cyan-400" />
                      Engineer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Describe work completed, any issues found, recommendations..."
                      value={engineerNotes}
                      onChange={(e) => setEngineerNotes(e.target.value)}
                      className="bg-slate-700 border-slate-600 min-h-[120px]"
                      data-testid="engineer-notes-input"
                    />
                  </CardContent>
                </Card>

                {/* Complete Button */}
                <Button
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-lg"
                  onClick={handleComplete}
                  data-testid="complete-job-btn"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Complete Job
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Bottom Navigation (when not in job sheet) */}
      {!showJobSheet && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-4 py-2">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              className={`flex-col h-auto py-2 ${activeTab === "jobs" ? "text-cyan-400" : "text-slate-400"}`}
              onClick={() => setActiveTab("jobs")}
            >
              <Wrench className="h-5 w-5" />
              <span className="text-xs mt-1">Jobs</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-col h-auto py-2 text-slate-400"
              onClick={() => navigate("/dashboard")}
              data-testid="nav-office-btn"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Office</span>
            </Button>
            <Button
              variant="ghost"
              className="flex-col h-auto py-2 text-slate-400"
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Button>
          </div>
        </nav>
      )}

      {/* Signature Dialog */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="heading">Customer Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white rounded-lg overflow-hidden">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  width: 350,
                  height: 200,
                  className: "signature-canvas",
                }}
                data-testid="signature-canvas"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => sigCanvas.current?.clear()}
              >
                Clear
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  const signatureData = sigCanvas.current?.toDataURL();
                  submitCompletion(signatureData);
                }}
                data-testid="submit-signature-btn"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EngineerMobile;
