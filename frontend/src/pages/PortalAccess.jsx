import { useState, useEffect } from "react";
import { api } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Plus, Key, Copy, Trash2, Building2, ExternalLink, Mail, User } from "lucide-react";

const PortalAccess = () => {
  const [accessList, setAccessList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccessCode, setNewAccessCode] = useState(null);

  const [form, setForm] = useState({
    customer_id: "",
    email: "",
    contact_name: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accessRes, customersRes] = await Promise.all([
        api.get("/portal/access-list"),
        api.get("/customers"),
      ]);
      setAccessList(accessRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error("Failed to load portal access data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/portal/create-access", form);
      setNewAccessCode({
        code: res.data.access_code,
        email: res.data.email,
        customer: res.data.customer_name,
      });
      toast.success("Portal access created");
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create portal access");
    }
  };

  const handleRevoke = async (accessId) => {
    if (!window.confirm("Are you sure you want to revoke this portal access?")) return;
    try {
      await api.delete(`/portal/access/${accessId}`);
      toast.success("Portal access revoked");
      fetchData();
    } catch (error) {
      toast.error("Failed to revoke access");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const resetForm = () => {
    setForm({ customer_id: "", email: "", contact_name: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="portal-access-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 heading">Customer Portal Access</h1>
          <p className="text-slate-500 text-sm">Manage customer portal logins</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); setNewAccessCode(null); } }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="create-portal-access-btn">
              <Plus className="h-4 w-4 mr-2" />
              Grant Portal Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="heading">Grant Customer Portal Access</DialogTitle>
            </DialogHeader>

            {newAccessCode ? (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="font-semibold text-emerald-800 mb-2">Portal Access Created!</p>
                  <p className="text-sm text-emerald-700 mb-4">
                    Share these credentials with the customer. The access code will only be shown once.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-500 text-xs">Customer</Label>
                      <p className="font-medium">{newAccessCode.customer}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-xs">Email</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{newAccessCode.email}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(newAccessCode.email)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-xs">Access Code</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg font-bold text-cyan-600 tracking-widest">{newAccessCode.code}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(newAccessCode.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-xs">Portal URL</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-600">{window.location.origin}/portal</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(`${window.location.origin}/portal`)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setDialogOpen(false); setNewAccessCode(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger data-testid="portal-customer-select">
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
                  <Label>Contact Name *</Label>
                  <Input
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="John Smith"
                    required
                    data-testid="portal-contact-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@customer.com"
                    required
                    data-testid="portal-email-input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="create-access-btn">
                    Create Access
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Portal Link */}
      <Card className="border-cyan-200 bg-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-200">
                <ExternalLink className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <p className="font-semibold text-cyan-800">Customer Portal URL</p>
                <p className="text-sm text-cyan-700">{window.location.origin}/portal</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-cyan-300 text-cyan-700"
              onClick={() => copyToClipboard(`${window.location.origin}/portal`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access List */}
      <Card>
        <CardHeader>
          <CardTitle className="heading">Active Portal Users</CardTitle>
          <CardDescription>Customers with portal access can view their service history and PM schedules</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {accessList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Key className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No portal users yet</p>
              <p className="text-sm">Grant access to customers so they can view their service records</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessList.map((access) => (
                  <TableRow key={access.id} className="table-row-hover" data-testid={`portal-access-row-${access.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{access.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {access.contact_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {access.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {access.created_at?.split("T")[0]}
                    </TableCell>
                    <TableCell>
                      {access.last_login ? (
                        <span className="text-slate-500">{access.last_login.split("T")[0]}</span>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRevoke(access.id)}
                        data-testid={`revoke-access-${access.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default PortalAccess;
