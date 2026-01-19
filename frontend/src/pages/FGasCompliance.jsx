import { useState, useEffect } from "react";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { 
  Snowflake, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  FileText, 
  TrendingUp,
  Calendar,
  Thermometer,
  Search
} from "lucide-react";

const FGasCompliance = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [logForm, setLogForm] = useState({
    asset_id: "",
    log_type: "leak_check",
    refrigerant_added: "",
    refrigerant_recovered: "",
    refrigerant_lost: "",
    technician_certification: "",
    leak_test_result: "",
    test_pressure: "",
    test_method: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, assetsRes] = await Promise.all([
        api.get("/fgas/dashboard"),
        api.get("/assets"),
      ]);
      setDashboardData(dashboardRes.data);
      setAssets(assetsRes.data.filter(a => a.refrigerant_type && a.refrigerant_charge));
    } catch (error) {
      toast.error("Failed to load F-Gas data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/fgas/logs", logForm);
      toast.success("F-Gas log created");
      setLogDialogOpen(false);
      resetLogForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create log");
    }
  };

  const resetLogForm = () => {
    setLogForm({
      asset_id: "",
      log_type: "leak_check",
      refrigerant_added: "",
      refrigerant_recovered: "",
      refrigerant_lost: "",
      technician_certification: "",
      leak_test_result: "",
      test_pressure: "",
      test_method: "",
      notes: "",
    });
  };

  const filteredAssets = assets.filter((a) =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="fgas-compliance-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 heading">F-Gas Compliance</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Track F-Gas regulations and leak checks</p>
        </div>
        <Dialog open={logDialogOpen} onOpenChange={(open) => { setLogDialogOpen(open); if (!open) resetLogForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="add-fgas-log-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add F-Gas Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="heading">Add F-Gas Log</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset *</Label>
                  <Select value={logForm.asset_id} onValueChange={(v) => setLogForm({ ...logForm, asset_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.refrigerant_type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Log Type *</Label>
                  <Select value={logForm.log_type} onValueChange={(v) => setLogForm({ ...logForm, log_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="leak_check">Leak Check</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                      <SelectItem value="disposal">Disposal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Refrigerant Added (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={logForm.refrigerant_added}
                    onChange={(e) => setLogForm({ ...logForm, refrigerant_added: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refrigerant Recovered (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={logForm.refrigerant_recovered}
                    onChange={(e) => setLogForm({ ...logForm, refrigerant_recovered: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refrigerant Lost (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={logForm.refrigerant_lost}
                    onChange={(e) => setLogForm({ ...logForm, refrigerant_lost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Leak Test Result</Label>
                  <Select value={logForm.leak_test_result || "none"} onValueChange={(v) => setLogForm({ ...logForm, leak_test_result: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Tested</SelectItem>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="minor_leak">Minor Leak</SelectItem>
                      <SelectItem value="major_leak">Major Leak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Method</Label>
                  <Select value={logForm.test_method || "none"} onValueChange={(v) => setLogForm({ ...logForm, test_method: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pressure_test">Pressure Test</SelectItem>
                      <SelectItem value="bubble_test">Bubble Test</SelectItem>
                      <SelectItem value="electronic_detector">Electronic Detector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Pressure (bar)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={logForm.test_pressure}
                    onChange={(e) => setLogForm({ ...logForm, test_pressure: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Technician Certification</Label>
                  <Input
                    value={logForm.technician_certification}
                    onChange={(e) => setLogForm({ ...logForm, technician_certification: e.target.value })}
                    placeholder="Certification number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setLogDialogOpen(false); resetLogForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={!logForm.asset_id}>
                  Create Log
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total F-Gas Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-cyan-600" />
              <span className="text-2xl font-bold">{dashboardData?.total_fgas_assets || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Leak Checks Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{dashboardData?.leak_check_overdue_count || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{dashboardData?.leak_check_due_soon_count || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Refrigerant Added (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{dashboardData?.annual_summary?.refrigerant_added_kg || 0} kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Leak Checks
            </CardTitle>
            <CardDescription>Assets requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.leak_check_overdue?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.leak_check_overdue.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-slate-500">{asset.refrigerant_type} - {asset.refrigerant_charge}kg</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p>No overdue leak checks</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Due Soon
            </CardTitle>
            <CardDescription>Assets due for leak check within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.leak_check_due_soon?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.leak_check_due_soon.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-slate-500">{asset.refrigerant_type} - {asset.refrigerant_charge}kg</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-amber-600">
                      <Calendar className="h-3 w-3" />
                      {asset.fgas_next_leak_check_due?.split("T")[0]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <p>No leak checks due soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Annual Summary ({dashboardData?.annual_summary?.year})
          </CardTitle>
          <CardDescription>F-Gas activity for the current year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Refrigerant Added</p>
              <p className="text-2xl font-bold text-emerald-600">{dashboardData?.annual_summary?.refrigerant_added_kg || 0} kg</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Refrigerant Recovered</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardData?.annual_summary?.refrigerant_recovered_kg || 0} kg</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Refrigerant Lost</p>
              <p className="text-2xl font-bold text-red-600">{dashboardData?.annual_summary?.refrigerant_lost_kg || 0} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-cyan-600" />
            Inventory by Category
          </CardTitle>
          <CardDescription>F-Gas equipment grouped by category</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.inventory_by_category && Object.keys(dashboardData.inventory_by_category).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Total Charge (kg)</TableHead>
                  <TableHead>CO2 Equivalent (tonnes)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(dashboardData.inventory_by_category).map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell className="font-medium">{category}</TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell>{data.total_charge_kg.toFixed(2)}</TableCell>
                    <TableCell>{data.total_co2_equivalent.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Snowflake className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No F-Gas inventory data</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Recent F-Gas Logs
          </CardTitle>
          <CardDescription>Latest F-Gas activity records</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.recent_logs?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Added (kg)</TableHead>
                  <TableHead>Recovered (kg)</TableHead>
                  <TableHead>Test Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recent_logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.created_at?.split("T")[0]}</TableCell>
                    <TableCell className="capitalize">{log.log_type?.replace("_", " ")}</TableCell>
                    <TableCell>{log.refrigerant_added || "-"}</TableCell>
                    <TableCell>{log.refrigerant_recovered || "-"}</TableCell>
                    <TableCell>
                      {log.leak_test_result ? (
                        <Badge className={
                          log.leak_test_result === "pass" ? "bg-emerald-100 text-emerald-800" :
                          log.leak_test_result === "fail" ? "bg-red-100 text-red-800" :
                          "bg-amber-100 text-amber-800"
                        }>
                          {log.leak_test_result.replace("_", " ")}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No F-Gas logs yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FGasCompliance;
