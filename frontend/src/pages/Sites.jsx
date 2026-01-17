import { useState, useEffect } from "react";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Plus, Search, MapPin, Pencil, Trash2, Building2, Key, Clock } from "lucide-react";

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    customer_id: "",
    name: "",
    address: "",
    access_notes: "",
    key_location: "",
    opening_hours: "",
    contact_name: "",
    contact_phone: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sitesRes, customersRes] = await Promise.all([
        api.get("/sites"),
        api.get("/customers"),
      ]);
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
      if (editingSite) {
        await api.put(`/sites/${editingSite.id}`, form);
        toast.success("Site updated");
      } else {
        await api.post("/sites", form);
        toast.success("Site created");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save site");
    }
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setForm({
      customer_id: site.customer_id,
      name: site.name,
      address: site.address,
      access_notes: site.access_notes,
      key_location: site.key_location,
      opening_hours: site.opening_hours,
      contact_name: site.contact_name,
      contact_phone: site.contact_phone,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    try {
      await api.delete(`/sites/${id}`);
      toast.success("Site deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete site");
    }
  };

  const resetForm = () => {
    setEditingSite(null);
    setForm({
      customer_id: "",
      name: "",
      address: "",
      access_notes: "",
      key_location: "",
      opening_hours: "",
      contact_name: "",
      contact_phone: "",
    });
  };

  const filteredSites = sites.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerName = (customerId) => {
    return customers.find((c) => c.id === customerId)?.company_name || "Unknown";
  };

  return (
    <div className="space-y-6" data-testid="sites-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">Sites</h1>
          <p className="text-slate-500 text-sm">Manage customer locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="add-site-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="heading">{editingSite ? "Edit Site" : "Add Site"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger data-testid="site-customer-select">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Site Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Main Store"
                    required
                    data-testid="site-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Opening Hours</Label>
                  <Input
                    value={form.opening_hours}
                    onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                    placeholder="Mon-Fri 9am-6pm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address including postcode"
                  required
                  data-testid="site-address-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="07700 900000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Location</Label>
                <Input
                  value={form.key_location}
                  onChange={(e) => setForm({ ...form, key_location: e.target.value })}
                  placeholder="Key box by back door, code 1234"
                />
              </div>
              <div className="space-y-2">
                <Label>Access Notes</Label>
                <Textarea
                  value={form.access_notes}
                  onChange={(e) => setForm({ ...form, access_notes: e.target.value })}
                  placeholder="Special access instructions, parking info..."
                  data-testid="site-access-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="save-site-btn">
                  {editingSite ? "Update" : "Create"}
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
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="site-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sites Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No sites found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id} className="table-row-hover" data-testid={`site-row-${site.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="font-medium">{site.name}</span>
                          {site.opening_hours && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {site.opening_hours}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {getCustomerName(site.customer_id)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{site.address}</TableCell>
                    <TableCell>
                      {site.contact_name && (
                        <div className="text-sm">
                          <p>{site.contact_name}</p>
                          {site.contact_phone && <p className="text-slate-500">{site.contact_phone}</p>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(site)}
                          data-testid={`edit-site-${site.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(site.id)}
                          data-testid={`delete-site-${site.id}`}
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

export default Sites;
