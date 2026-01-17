import { useState, useEffect } from "react";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Calendar, Thermometer, Play, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const PMAutomation = () => {
  const [status, setStatus] = useState(null);
  const [pmDueList, setPmDueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, pmRes] = await Promise.all([
        api.get("/pm/status"),
        api.get("/reports/pm-due-list"),
      ]);
      setStatus(statusRes.data);
      setPmDueList(pmRes.data);
    } catch (error) {
      toast.error("Failed to load PM status");
    } finally {
      setLoading(false);
    }
  };

  const generatePMJobs = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/pm/generate-jobs");
      if (res.data.jobs_created > 0) {
        toast.success(`Created ${res.data.jobs_created} PM job(s)`);
      } else {
        toast.info("No new PM jobs needed - all overdue assets already have open jobs");
      }
      fetchData();
    } catch (error) {
      toast.error("Failed to generate PM jobs");
    } finally {
      setGenerating(false);
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
    <div className="space-y-6" data-testid="pm-automation-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">PM Automation</h1>
          <p className="text-slate-500 text-sm">Manage preventive maintenance job generation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-cyan-600 hover:bg-cyan-700" 
            onClick={generatePMJobs}
            disabled={generating}
            data-testid="generate-pm-btn"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate PM Jobs
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={status?.overdue > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Overdue</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{status?.overdue || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Assets past PM due date</p>
              </div>
              <div className={`p-3 rounded-xl ${status?.overdue > 0 ? "bg-red-200" : "bg-slate-100"}`}>
                <AlertTriangle className={`h-6 w-6 ${status?.overdue > 0 ? "text-red-600" : "text-slate-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={status?.due_this_week > 0 ? "border-amber-200 bg-amber-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Due This Week</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{status?.due_this_week || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Within next 7 days</p>
              </div>
              <div className={`p-3 rounded-xl ${status?.due_this_week > 0 ? "bg-amber-200" : "bg-slate-100"}`}>
                <Clock className={`h-6 w-6 ${status?.due_this_week > 0 ? "text-amber-600" : "text-slate-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Due This Month</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{status?.due_this_month || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Within next 30 days</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100">
                <Calendar className="h-6 w-6 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="heading text-lg">How PM Automation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 rounded-full bg-cyan-100 text-cyan-600">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Track Asset PM Dates</p>
                <p className="text-sm text-slate-500">Each asset has a PM interval (3/6/12 months) and next due date</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 rounded-full bg-cyan-100 text-cyan-600">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Generate Jobs</p>
                <p className="text-sm text-slate-500">Click "Generate PM Jobs" to create service jobs for overdue assets</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 rounded-full bg-cyan-100 text-cyan-600">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">Auto-Update</p>
                <p className="text-sm text-slate-500">When a PM job is completed, the next PM date is automatically set</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PM Due List */}
      <Card>
        <CardHeader>
          <CardTitle className="heading flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-amber-600" />
            Assets Due for PM
            {pmDueList.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 ml-2">{pmDueList.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>These assets are overdue or due for preventive maintenance</CardDescription>
        </CardHeader>
        <CardContent>
          {pmDueList.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <p>All assets are up to date with PM schedules</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pmDueList.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                  data-testid={`pm-due-asset-${asset.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-200">
                      <Thermometer className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      <p className="text-sm text-slate-500">
                        {asset.make} {asset.model} {asset.serial_number && `• S/N: ${asset.serial_number}`}
                      </p>
                      <p className="text-sm text-slate-500">{asset.site?.name} - {asset.site?.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-amber-100 text-amber-800">PM Overdue</Badge>
                    <p className="text-xs text-slate-500 mt-1">Was due: {asset.next_pm_due?.split("T")[0]}</p>
                    <p className="text-xs text-slate-500">Interval: {asset.pm_interval_months} months</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PMAutomation;
