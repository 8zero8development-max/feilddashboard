import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Building2,
  Thermometer,
  History,
  Calendar,
  Receipt,
  LogOut,
  Menu,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Portal API instance
const portalApi = axios.create({ baseURL: `${BACKEND_URL}/api` });

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("portal_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("portal_token");
      localStorage.removeItem("portal_customer");
      localStorage.removeItem("portal_contact");
      window.location.href = "/portal";
    }
    return Promise.reject(error);
  }
);

// Portal Context
const PortalContext = createContext(null);
export const usePortal = () => useContext(PortalContext);

const navItems = [
  { name: "Overview", path: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Sites", path: "/portal/sites", icon: MapPin },
  { name: "Assets", path: "/portal/assets", icon: Thermometer },
  { name: "Service History", path: "/portal/history", icon: History },
  { name: "PM Schedule", path: "/portal/pm-schedule", icon: Calendar },
  { name: "Invoices", path: "/portal/invoices", icon: Receipt },
];

// Portal Layout
export const CustomerPortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [contactName, setContactName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("portal_token");
    if (!token) {
      navigate("/portal");
      return;
    }
    setCustomerName(localStorage.getItem("portal_customer") || "");
    setContactName(localStorage.getItem("portal_contact") || "");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_customer");
    localStorage.removeItem("portal_contact");
    navigate("/portal");
  };

  return (
    <PortalContext.Provider value={{ portalApi, customerName, contactName }}>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-slate-900 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
              <span className="font-semibold">{customerName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-6">
                <img
                  src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
                  alt="Craven"
                  className="h-8 w-8"
                />
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <img
              src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
              alt="Craven"
              className="h-10 w-10"
            />
            <div>
              <p className="text-white font-semibold text-sm">Customer Portal</p>
              <p className="text-cyan-400 text-xs truncate max-w-[140px]">{customerName}</p>
            </div>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          <div className="px-3 py-4 border-t border-slate-800">
            <div className="px-4 py-2 mb-2">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm text-white truncate">{contactName}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:pl-64 min-h-screen">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </PortalContext.Provider>
  );
};

// Portal Dashboard
export const CustomerPortalDashboard = () => {
  const { portalApi, customerName } = usePortal();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await portalApi.get("/portal/dashboard");
      setStats(res.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
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
    <div className="space-y-6" data-testid="portal-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Welcome, {customerName}</h1>
        <p className="text-slate-500">Your service overview at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100">
                <MapPin className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.sites_count || 0}</p>
                <p className="text-xs text-slate-500">Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Thermometer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.assets_count || 0}</p>
                <p className="text-xs text-slate-500">Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.completed_jobs || 0}</p>
                <p className="text-xs text-slate-500">Completed Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending_jobs || 0}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PM Due Alert */}
      {stats?.pm_due_count > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">
                  {stats.pm_due_count} Asset{stats.pm_due_count > 1 ? "s" : ""} Due for PM Service
                </p>
                <p className="text-sm text-amber-700">
                  Regular maintenance helps prevent breakdowns and extends equipment life.
                </p>
              </div>
              <Link to="/portal/pm-schedule" className="ml-auto">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  View Schedule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/portal/history">
          <Card className="hover:border-cyan-300 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-100">
                  <History className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Service History</p>
                  <p className="text-sm text-slate-500">View all completed service visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/pm-schedule">
          <Card className="hover:border-cyan-300 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">PM Schedule</p>
                  <p className="text-sm text-slate-500">Upcoming maintenance schedules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

// Portal Sites
export const CustomerPortalSites = () => {
  const { portalApi } = usePortal();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await portalApi.get("/portal/sites");
      setSites(res.data);
    } catch (error) {
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="portal-sites">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Your Sites</h1>
        <p className="text-slate-500">Locations we service for you</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => (
          <Card key={site.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{site.name}</p>
                  <p className="text-sm text-slate-500">{site.address}</p>
                  {site.contact_name && (
                    <p className="text-sm text-slate-500 mt-2">
                      Contact: {site.contact_name} {site.contact_phone && `• ${site.contact_phone}`}
                    </p>
                  )}
                  {site.opening_hours && (
                    <p className="text-xs text-slate-400 mt-1">Hours: {site.opening_hours}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Portal Assets
export const CustomerPortalAssets = () => {
  const { portalApi } = usePortal();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await portalApi.get("/portal/assets");
      setAssets(res.data);
    } catch (error) {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const isPMDue = (asset) => asset.next_pm_due && new Date(asset.next_pm_due) <= new Date();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="portal-assets">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Your Assets</h1>
        <p className="text-slate-500">Equipment we maintain for you</p>
      </div>
      <div className="space-y-3">
        {assets.map((asset) => (
          <Card key={asset.id} className={isPMDue(asset) ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isPMDue(asset) ? "bg-amber-200" : "bg-cyan-100"}`}>
                    <Thermometer className={`h-5 w-5 ${isPMDue(asset) ? "text-amber-700" : "text-cyan-600"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{asset.name}</p>
                    <p className="text-sm text-slate-500">{asset.make} {asset.model}</p>
                    {asset.serial_number && <p className="text-xs text-slate-400 mono">S/N: {asset.serial_number}</p>}
                    <p className="text-sm text-slate-500 mt-1">{asset.site?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isPMDue(asset) ? (
                    <Badge className="bg-amber-100 text-amber-800">PM Due</Badge>
                  ) : asset.next_pm_due ? (
                    <div>
                      <p className="text-xs text-slate-500">Next PM</p>
                      <p className="text-sm font-medium">{asset.next_pm_due.split("T")[0]}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Portal Service History
export const CustomerPortalHistory = () => {
  const { portalApi } = usePortal();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await portalApi.get("/portal/service-history");
      setJobs(res.data);
    } catch (error) {
      toast.error("Failed to load service history");
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = { breakdown: "Breakdown", pm_service: "PM Service", install: "Install", quote_visit: "Quote" };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="portal-history">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Service History</h1>
        <p className="text-slate-500">All completed service visits</p>
      </div>
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No service history yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm text-cyan-600">{job.job_number}</p>
                    <p className="font-semibold text-slate-900">{typeLabels[job.job_type] || job.job_type}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">{job.description}</p>
                {job.completion_notes && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p className="font-medium text-slate-700 mb-1">Engineer Notes:</p>
                    <p className="text-slate-600">{job.completion_notes}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span>{job.site?.name}</span>
                  <span>{job.updated_at?.split("T")[0]}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Portal PM Schedule
export const CustomerPortalPMSchedule = () => {
  const { portalApi } = usePortal();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await portalApi.get("/portal/upcoming-pm");
      setSchedule(res.data);
    } catch (error) {
      toast.error("Failed to load PM schedule");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }

  const overdue = schedule.filter((s) => s.is_overdue);
  const upcoming = schedule.filter((s) => !s.is_overdue);

  return (
    <div className="space-y-6" data-testid="portal-pm-schedule">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">PM Schedule</h1>
        <p className="text-slate-500">Upcoming preventive maintenance</p>
      </div>

      {overdue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Overdue ({overdue.length})
          </h2>
          {overdue.map((item) => (
            <Card key={item.asset_id} className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.asset_name}</p>
                    <p className="text-sm text-slate-500">{item.make_model}</p>
                    <p className="text-sm text-slate-500">{item.site_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                    <p className="text-xs text-slate-500 mt-1">Was due: {item.next_pm_due?.split("T")[0]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No upcoming PM scheduled</p>
            </CardContent>
          </Card>
        ) : (
          upcoming.map((item) => (
            <Card key={item.asset_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.asset_name}</p>
                    <p className="text-sm text-slate-500">{item.make_model}</p>
                    <p className="text-sm text-slate-500">{item.site_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{item.next_pm_due?.split("T")[0]}</p>
                    <p className="text-xs text-slate-500">Every {item.pm_interval_months} months</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Portal Invoices
export const CustomerPortalInvoices = () => {
  const { portalApi } = usePortal();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await portalApi.get("/portal/invoices");
      setInvoices(res.data);
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = { unpaid: "bg-amber-100 text-amber-800", paid: "bg-emerald-100 text-emerald-800", overdue: "bg-red-100 text-red-800" };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="portal-invoices">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 heading">Invoices</h1>
        <p className="text-slate-500">Your billing history</p>
      </div>
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No invoices yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-cyan-600">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-500">Due: {invoice.due_date?.split("T")[0]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">£{invoice.total?.toFixed(2)}</p>
                    <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerPortalLogin;
