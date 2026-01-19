import { useState, useEffect } from "react";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Thermometer, Pencil, Trash2, MapPin, Calendar, Wrench } from "lucide-react";

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [sites, setSites] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [form, setForm] = useState({
    site_id: "",
    name: "",
    make: "",
    model: "",
    serial_number: "",
    install_date: "",
    warranty_expiry: "",
    refrigerant_type: "",
    refrigerant_charge: "",
    pm_interval_months: 6,
    notes: "",
    fgas_category: "",
    fgas_co2_equivalent: "",
    fgas_certified_technician: "",
    fgas_leak_check_interval: 12,
    fgas_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, sitesRes, customersRes] = await Promise.all([
        api.get("/assets"),
        api.get("/sites"),
        api.get("/customers"),
      ]);
      setAssets(assetsRes.data);
      setSites(sitesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, form);
        toast.success("Asset updated");
      } else {
        await api.post("/assets", form);
        toast.success("Asset created");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save asset");
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    const site = sites.find((s) => s.id === asset.site_id);
    setSelectedCustomer(site?.customer_id || "");
    setForm({
      site_id: asset.site_id,
      name: asset.name,
      make: asset.make,
      model: asset.model,
      serial_number: asset.serial_number,
      install_date: asset.install_date || "",
      warranty_expiry: asset.warranty_expiry || "",
      refrigerant_type: asset.refrigerant_type,
      refrigerant_charge: asset.refrigerant_charge,
      pm_interval_months: asset.pm_interval_months,
      notes: asset.notes,
      fgas_category: asset.fgas_category || "",
      fgas_co2_equivalent: asset.fgas_co2_equivalent || "",
      fgas_certified_technician: asset.fgas_certified_technician || "",
      fgas_leak_check_interval: asset.fgas_leak_check_interval || 12,
      fgas_notes: asset.fgas_notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success("Asset deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete asset");
    }
  };

  const resetForm = () => {
    setEditingAsset(null);
    setSelectedCustomer("");
    setForm({
      site_id: "",
      name: "",
      make: "",
      model: "",
      serial_number: "",
      install_date: "",
      warranty_expiry: "",
      refrigerant_type: "",
      refrigerant_charge: "",
      pm_interval_months: 6,
      notes: "",
      fgas_category: "",
      fgas_co2_equivalent: "",
      fgas_certified_technician: "",
      fgas_leak_check_interval: 12,
      fgas_notes: "",
    });
  };

  const filteredAssets = assets.filter((a) =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.make?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSiteName = (siteId) => sites.find((s) => s.id === siteId)?.name || "Unknown";
  const getCustomerForSite = (siteId) => {
    const site = sites.find((s) => s.id === siteId);
    return customers.find((c) => c.id === site?.customer_id)?.company_name || "";
  };

  const isPMDue = (asset) => {
    if (!asset.next_pm_due) return false;
    return new Date(asset.next_pm_due) <= new Date();
  };

  const filteredSites = selectedCustomer ? sites.filter((s) => s.customer_id === selectedCustomer) : sites;

  return (
    <div className="space-y-6" data-testid="assets-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">Assets</h1>
          <p className="text-slate-500 text-sm">Manage refrigeration and HVAC equipment</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="add-asset-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="heading">{editingAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={selectedCustomer || "all"} onValueChange={(v) => { setSelectedCustomer(v === "all" ? "" : v); setForm({ ...form, site_id: "" }); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Site *</Label>
                  <Select value={form.site_id} onValueChange={(v) => setForm({ ...form, site_id: v })}>
                    <SelectTrigger data-testid="asset-site-select">
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

              <div className="space-y-2">
                <Label>Asset Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Walk-in Freezer, Display Fridge #1"
                  required
                  data-testid="asset-name-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                    placeholder="e.g., Tefcold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="e.g., GS365"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    placeholder="e.g., SN123456"
                    className="mono"
                    data-testid="asset-serial-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Install Date</Label>
                  <Input
                    type="date"
                    value={form.install_date}
                    onChange={(e) => setForm({ ...form, install_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warranty Expiry</Label>
                  <Input
                    type="date"
                    value={form.warranty_expiry}
                    onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Refrigerant Type</Label>
                  <Select value={form.refrigerant_type} onValueChange={(v) => setForm({ ...form, refrigerant_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R134a">R134a</SelectItem>
                      <SelectItem value="R404A">R404A</SelectItem>
                      <SelectItem value="R410A">R410A</SelectItem>
                      <SelectItem value="R407C">R407C</SelectItem>
                      <SelectItem value="R32">R32</SelectItem>
                      <SelectItem value="R290">R290 (Propane)</SelectItem>
                      <SelectItem value="R600a">R600a (Isobutane)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Charge (kg)</Label>
                  <Input
                    value={form.refrigerant_charge}
                    onChange={(e) => setForm({ ...form, refrigerant_charge: e.target.value })}
                    placeholder="e.g., 2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PM Interval (months)</Label>
                  <Select value={form.pm_interval_months?.toString()} onValueChange={(v) => setForm({ ...form, pm_interval_months: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes about this asset..."
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">F-Gas Compliance</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>F-Gas Category</Label>
                    <Select value={form.fgas_category || "none"} onValueChange={(v) => setForm({ ...form, fgas_category: v === "none" ? "" : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Applicable</SelectItem>
                        <SelectItem value="1">Category 1 (5+ tonnes CO2e)</SelectItem>
                        <SelectItem value="2">Category 2 (50+ tonnes CO2e)</SelectItem>
                        <SelectItem value="3">Category 3 (500+ tonnes CO2e)</SelectItem>
                        <SelectItem value="4">Category 4 (Hermetically sealed)</SelectItem>
                        <SelectItem value="5">Category 5 (Fire protection)</SelectItem>
                        <SelectItem value="6">Category 6 (Electrical switchgear)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>CO2 Equivalent (tonnes)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.fgas_co2_equivalent}
                      onChange={(e) => setForm({ ...form, fgas_co2_equivalent: e.target.value })}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Leak Check Interval (months)</Label>
                    <Select value={form.fgas_leak_check_interval?.toString()} onValueChange={(v) => setForm({ ...form, fgas_leak_check_interval: parseInt(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Certified Technician</Label>
                    <Input
                      value={form.fgas_certified_technician}
                      onChange={(e) => setForm({ ...form, fgas_certified_technician: e.target.value })}
                      placeholder="Certification number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>F-Gas Notes</Label>
                    <Input
                      value={form.fgas_notes}
                      onChange={(e) => setForm({ ...form, fgas_notes: e.target.value })}
                      placeholder="F-Gas specific notes..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="save-asset-btn">
                  {editingAsset ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="asset-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Thermometer className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No assets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>PM Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="table-row-hover" data-testid={`asset-row-${asset.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isPMDue(asset) ? "bg-amber-100" : "bg-cyan-100"}`}>
                          <Thermometer className={`h-4 w-4 ${isPMDue(asset) ? "text-amber-600" : "text-cyan-600"}`} />
                        </div>
                        <div>
                          <span className="font-medium">{asset.name}</span>
                          {asset.serial_number && (
                            <p className="text-xs text-slate-500 mono">S/N: {asset.serial_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {getSiteName(asset.site_id)}
                        </p>
                        <p className="text-slate-500">{getCustomerForSite(asset.site_id)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {asset.make && <p>{asset.make} {asset.model}</p>}
                        {asset.refrigerant_type && (
                          <p className="text-slate-500">{asset.refrigerant_type} {asset.refrigerant_charge && `• ${asset.refrigerant_charge}kg`}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isPMDue(asset) ? (
                        <Badge className="bg-amber-100 text-amber-800">PM Due</Badge>
                      ) : asset.next_pm_due ? (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="h-3 w-3" />
                          {asset.next_pm_due.split("T")[0]}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(asset)}
                          data-testid={`edit-asset-${asset.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(asset.id)}
                          data-testid={`delete-asset-${asset.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Assets;
