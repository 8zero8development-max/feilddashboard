import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Download,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Eye,
  Camera,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Settings,
  HelpCircle,
  FileCheck,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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

const PortalContext = createContext(null);
export const usePortal = () => useContext(PortalContext);

const navItems = [
  { name: "Overview", path: "/portal/dashboard", icon: LayoutDashboard },
  { name: "Sites", path: "/portal/sites", icon: MapPin },
  { name: "Assets", path: "/portal/assets", icon: Thermometer },
  { name: "Service History", path: "/portal/history", icon: History },
  { name: "PM Schedule", path: "/portal/pm-schedule", icon: Calendar },
  { name: "Invoices", path: "/portal/invoices", icon: Receipt },
  { name: "Approvals", path: "/portal/approvals", icon: FileCheck },
];

const mobileNavItems = [
  { name: "Home", path: "/portal/dashboard", icon: Home },
  { name: "Request", path: "/portal/request", icon: Plus, isAction: true },
  { name: "Assets", path: "/portal/assets", icon: Thermometer },
  { name: "More", path: "/portal/more", icon: MoreHorizontal },
];

const TopBar = ({ customerName, contactName, onSearch, onLogout, sidebarCollapsed, onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, type: "info", message: "Engineer en route to Downtown Site", time: "5 min ago" },
    { id: 2, type: "warning", message: "PM due for HVAC Unit 3", time: "1 hour ago" },
    { id: 3, type: "success", message: "Invoice #4592 has been paid", time: "Yesterday" },
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden lg:flex text-slate-600 hover:text-slate-900"
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-slate-900">Welcome, {customerName}</h2>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search assets, sites, or jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-slate-600 hover:text-slate-900"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full ${
                          notif.type === 'success' ? 'bg-emerald-100' :
                          notif.type === 'warning' ? 'bg-amber-100' : 'bg-cyan-100'
                        }`}>
                          {notif.type === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> :
                           notif.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> :
                           <Bell className="h-3.5 w-3.5 text-cyan-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" className="w-full text-cyan-600 hover:text-cyan-700">
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
              <User className="h-4 w-4 text-cyan-600" />
            </div>
            <div className="hidden xl:block">
              <p className="text-sm font-medium text-slate-900">{contactName}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const MobileBottomNav = ({ onRequestService }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item.isAction) {
      onRequestService();
    } else if (item.path === "/portal/more") {
      return;
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          if (item.isAction) {
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center justify-center p-2 -mt-6"
              >
                <div className="h-12 w-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-slate-600 mt-1">{item.name}</span>
              </button>
            );
          }

          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center p-2 min-w-[60px] ${
                isActive ? "text-cyan-600" : "text-slate-500"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-cyan-600" : "text-slate-400"}`} />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const ServiceRequestModal = ({ open, onOpenChange, sites, assets }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    site_id: "",
    asset_id: "",
    description: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredAssets = assets.filter(a => !formData.site_id || a.site_id === formData.site_id);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await portalApi.post("/portal/service-request", formData);
      toast.success("Service request submitted successfully!");
      onOpenChange(false);
      setStep(1);
      setFormData({ site_id: "", asset_id: "", description: "", priority: "medium" });
    } catch (error) {
      toast.error("Failed to submit service request");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.site_id;
    if (step === 2) return true;
    if (step === 3) return formData.description.trim().length > 0;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Service</DialogTitle>
          <DialogDescription>
            {step === 1 && "Where is the issue?"}
            {step === 2 && "What equipment needs attention?"}
            {step === 3 && "Describe the issue"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s <= step ? "bg-cyan-500" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <Label>Select Site</Label>
              <Select value={formData.site_id} onValueChange={(v) => setFormData({ ...formData, site_id: v, asset_id: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Select Equipment (Optional)</Label>
              <Select value={formData.asset_id} onValueChange={(v) => setFormData({ ...formData, asset_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose equipment or leave as General..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General / Not specific equipment</SelectItem>
                  {filteredAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} - {asset.make} {asset.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>What's happening?</Label>
                <Textarea
                  placeholder="Describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 min-h-[120px]"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait</SelectItem>
                    <SelectItem value="medium">Medium - Soon as possible</SelectItem>
                    <SelectItem value="high">High - Urgent</SelectItem>
                    <SelectItem value="urgent">Urgent - Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StatusCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "cyan", onClick }) => {
  const colorClasses = {
    cyan: { bg: "bg-cyan-50", iconBg: "bg-cyan-100", icon: "text-cyan-600", trend: "text-cyan-600" },
    emerald: { bg: "bg-emerald-50", iconBg: "bg-emerald-100", icon: "text-emerald-600", trend: "text-emerald-600" },
    amber: { bg: "bg-amber-50", iconBg: "bg-amber-100", icon: "text-amber-600", trend: "text-amber-600" },
    purple: { bg: "bg-purple-50", iconBg: "bg-purple-100", icon: "text-purple-600", trend: "text-purple-600" },
    red: { bg: "bg-red-50", iconBg: "bg-red-100", icon: "text-red-600", trend: "text-red-600" },
  };

  const colors = colorClasses[color] || colorClasses.cyan;

  return (
    <Card 
      className={`${colors.bg} border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${colors.iconBg}`}>
              <Icon className={`h-5 w-5 ${colors.icon}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-600">{title}</p>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
        )}
        {onClick && (
          <div className="flex items-center gap-1 text-xs text-cyan-600 mt-3 font-medium">
            View details <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AssetHealthBadge = ({ asset }) => {
  const now = new Date();
  const pmDue = asset.next_pm_due ? new Date(asset.next_pm_due) : null;
  const daysToPM = pmDue ? Math.ceil((pmDue - now) / (1000 * 60 * 60 * 24)) : null;

  let status = "good";
  let label = "Good";
  let colorClass = "bg-emerald-100 text-emerald-700";

  if (pmDue) {
    if (daysToPM < 0) {
      status = "critical";
      label = "Overdue";
      colorClass = "bg-red-100 text-red-700";
    } else if (daysToPM <= 14) {
      status = "attention";
      label = "Due Soon";
      colorClass = "bg-amber-100 text-amber-700";
    }
  }

  return (
    <Badge className={`${colorClass} font-medium`}>
      {status === "good" && <CheckCircle className="h-3 w-3 mr-1" />}
      {status === "attention" && <AlertCircle className="h-3 w-3 mr-1" />}
      {status === "critical" && <XCircle className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <Skeleton className="h-48 w-full rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
  </div>
);

export const CustomerPortalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [contactName, setContactName] = useState("");
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [sites, setSites] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("portal_token");
    if (!token) {
      navigate("/portal");
      return;
    }
    setCustomerName(localStorage.getItem("portal_customer") || "");
    setContactName(localStorage.getItem("portal_contact") || "");
    
    fetchSitesAndAssets();
  }, [navigate]);

  const fetchSitesAndAssets = async () => {
    try {
      const [sitesRes, assetsRes] = await Promise.all([
        portalApi.get("/portal/sites"),
        portalApi.get("/portal/assets"),
      ]);
      setSites(sitesRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      console.error("Failed to fetch sites/assets for service request");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_customer");
    localStorage.removeItem("portal_contact");
    navigate("/portal");
  };

  const handleSearch = (query) => {
    toast.info(`Searching for: ${query}`);
  };

  return (
    <PortalContext.Provider value={{ portalApi, customerName, contactName, sites, assets }}>
      <div className="min-h-screen bg-slate-50">
        <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-600">
                <Menu className="h-6 w-6" />
              </Button>
              <span className="font-semibold text-slate-900">{customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-600">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
                    alt="Craven"
                    className="h-8 w-8"
                  />
                  <span className="text-white font-semibold">Customer Portal</span>
                </div>
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
              <div className="absolute bottom-4 left-4 right-4">
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
            </div>
          </div>
        )}

        <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 transition-all duration-300 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        }`}>
          <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <img
              src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
              alt="Craven"
              className="h-10 w-10"
            />
            {!sidebarCollapsed && (
              <div>
                <p className="text-white font-semibold text-sm">Customer Portal</p>
                <p className="text-cyan-400 text-xs truncate max-w-[140px]">{customerName}</p>
              </div>
            )}
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
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          <div className={`px-3 py-4 border-t border-slate-800 ${sidebarCollapsed ? "text-center" : ""}`}>
            {!sidebarCollapsed && (
              <div className="px-4 py-2 mb-2">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm text-white truncate">{contactName}</p>
              </div>
            )}
            <Button
              variant="ghost"
              className={`text-slate-400 hover:text-white hover:bg-slate-800 ${
                sidebarCollapsed ? "w-full justify-center" : "w-full justify-start"
              }`}
              onClick={handleLogout}
              title={sidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </aside>

        <main className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        } pb-20 lg:pb-0`}>
          <div className="hidden lg:block">
            <TopBar
              customerName={customerName}
              contactName={contactName}
              onSearch={handleSearch}
              onLogout={handleLogout}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
          
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

        <MobileBottomNav onRequestService={() => setShowServiceModal(true)} />

        <ServiceRequestModal
          open={showServiceModal}
          onOpenChange={setShowServiceModal}
          sites={sites}
          assets={assets}
        />
      </div>
    </PortalContext.Provider>
  );
};

export const CustomerPortalDashboard = () => {
  const { portalApi, customerName } = usePortal();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, historyRes] = await Promise.all([
        portalApi.get("/portal/dashboard"),
        portalApi.get("/portal/service-history"),
      ]);
      setStats(dashRes.data);
      setRecentActivity(historyRes.data.slice(0, 5));
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusMessage = () => {
    if (stats?.pm_due_count > 0) {
      return `Attention: ${stats.pm_due_count} asset${stats.pm_due_count > 1 ? 's' : ''} require${stats.pm_due_count === 1 ? 's' : ''} maintenance`;
    }
    if (stats?.pending_jobs > 0) {
      return `${stats.pending_jobs} job${stats.pending_jobs > 1 ? 's' : ''} in progress`;
    }
    return "All systems are operational";
  };

  const spendData = [
    { month: "Aug", amount: 2400, type: "Maintenance" },
    { month: "Sep", amount: 1800, type: "Repairs" },
    { month: "Oct", amount: 3200, type: "Maintenance" },
    { month: "Nov", amount: 2100, type: "Repairs" },
    { month: "Dec", amount: 2800, type: "Maintenance" },
    { month: "Jan", amount: 1950, type: "Repairs" },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6" data-testid="portal-dashboard">
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{getGreeting()}, {customerName}</h1>
            <p className="text-cyan-100 mt-1 flex items-center gap-2">
              {stats?.pm_due_count > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {getStatusMessage()}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-white text-cyan-600 hover:bg-cyan-50"
              onClick={() => setShowServiceModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Service
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Download className="h-4 w-4 mr-2" />
              Monthly Report
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Active Jobs"
          value={stats?.pending_jobs || 0}
          subtitle="In progress"
          icon={Clock}
          color="amber"
          onClick={() => navigate("/portal/history")}
        />
        <StatusCard
          title="PM Compliance"
          value={stats?.pm_due_count === 0 ? "100%" : `${Math.round(((stats?.assets_count - stats?.pm_due_count) / stats?.assets_count) * 100)}%`}
          subtitle={stats?.pm_due_count > 0 ? `${stats.pm_due_count} overdue` : "All up to date"}
          icon={CheckCircle2}
          color={stats?.pm_due_count > 0 ? "amber" : "emerald"}
          onClick={() => navigate("/portal/pm-schedule")}
        />
        <StatusCard
          title="Total Assets"
          value={stats?.assets_count || 0}
          subtitle={`Across ${stats?.sites_count || 0} sites`}
          icon={Thermometer}
          color="purple"
          onClick={() => navigate("/portal/assets")}
        />
        <StatusCard
          title="Completed"
          value={stats?.completed_jobs || 0}
          subtitle="Jobs this year"
          icon={CheckCircle2}
          color="emerald"
          trend="up"
          trendValue="+12%"
          onClick={() => navigate("/portal/history")}
        />
      </div>

      {stats?.pm_due_count > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">
                    {stats.pm_due_count} Asset{stats.pm_due_count > 1 ? "s" : ""} Due for PM Service
                  </p>
                  <p className="text-sm text-amber-700">
                    Regular maintenance helps prevent breakdowns and extends equipment life.
                  </p>
                </div>
              </div>
              <Link to="/portal/pm-schedule">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap">
                  View Schedule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Spend by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {spendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.type === 'Maintenance' ? '#06b6d4' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-cyan-500" />
                <span className="text-sm text-slate-600">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm text-slate-600">Repairs</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Link to="/portal/history">
                <Button variant="ghost" size="sm" className="text-cyan-600">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((job) => (
                  <div key={job.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg ${
                      job.job_type === 'pm_service' ? 'bg-emerald-100' :
                      job.job_type === 'breakdown' ? 'bg-red-100' : 'bg-cyan-100'
                    }`}>
                      {job.job_type === 'pm_service' ? (
                        <Wrench className="h-4 w-4 text-emerald-600" />
                      ) : job.job_type === 'breakdown' ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-cyan-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {job.description || job.job_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">{job.site?.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">Completed</Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        {job.updated_at?.split("T")[0]}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/portal/history">
          <Card className="hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-100 group-hover:bg-cyan-200 transition-colors">
                  <History className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Service History</p>
                  <p className="text-sm text-slate-500">View all completed visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/pm-schedule">
          <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">PM Schedule</p>
                  <p className="text-sm text-slate-500">Upcoming maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/invoices">
          <Card className="hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Invoices</p>
                  <p className="text-sm text-slate-500">View billing history</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <ServiceRequestModal
        open={showServiceModal}
        onOpenChange={setShowServiceModal}
        sites={[]}
        assets={[]}
      />
    </div>
  );
};

export const CustomerPortalSites = () => {
  const { portalApi } = usePortal();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

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

  const filteredSites = sites.filter(site => 
    site.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="portal-sites">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Sites</h1>
          <p className="text-slate-500">Locations we service for you</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredSites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No sites found</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
          {filteredSites.map((site) => (
            <Card key={site.id} className="hover:shadow-md transition-shadow">
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
                        Contact: {site.contact_name} {site.contact_phone && `- ${site.contact_phone}`}
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
      )}
    </div>
  );
};

export const CustomerPortalAssets = () => {
  const { portalApi } = usePortal();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filterHealth, setFilterHealth] = useState("all");

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

  const getAssetHealth = (asset) => {
    const now = new Date();
    const pmDue = asset.next_pm_due ? new Date(asset.next_pm_due) : null;
    const daysToPM = pmDue ? Math.ceil((pmDue - now) / (1000 * 60 * 60 * 24)) : null;
    
    if (pmDue && daysToPM < 0) return "critical";
    if (pmDue && daysToPM <= 14) return "attention";
    return "good";
  };

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = 
        asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterHealth === "all") return matchesSearch;
      return matchesSearch && getAssetHealth(asset) === filterHealth;
    })
    .sort((a, b) => {
      const healthOrder = { critical: 0, attention: 1, good: 2 };
      return healthOrder[getAssetHealth(a)] - healthOrder[getAssetHealth(b)];
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="portal-assets">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Assets</h1>
          <p className="text-slate-500">Equipment we maintain for you</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterHealth} onValueChange={setFilterHealth}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="attention">Attention</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-0">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {assets.filter(a => getAssetHealth(a) === "good").length}
            </p>
            <p className="text-xs text-emerald-600">Good</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {assets.filter(a => getAssetHealth(a) === "attention").length}
            </p>
            <p className="text-xs text-amber-600">Attention</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-700">
              {assets.filter(a => getAssetHealth(a) === "critical").length}
            </p>
            <p className="text-xs text-red-600">Critical</p>
          </CardContent>
        </Card>
      </div>

      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <Thermometer className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No assets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
          {filteredAssets.map((asset) => {
            const health = getAssetHealth(asset);
            return (
              <Card 
                key={asset.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  health === "critical" ? "border-red-200 bg-red-50/50" :
                  health === "attention" ? "border-amber-200 bg-amber-50/50" : ""
                }`}
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        health === "critical" ? "bg-red-100" :
                        health === "attention" ? "bg-amber-100" : "bg-cyan-100"
                      }`}>
                        <Thermometer className={`h-5 w-5 ${
                          health === "critical" ? "text-red-600" :
                          health === "attention" ? "text-amber-600" : "text-cyan-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{asset.name}</p>
                        <p className="text-sm text-slate-500">{asset.make} {asset.model}</p>
                        {asset.serial_number && (
                          <p className="text-xs text-slate-400 font-mono">S/N: {asset.serial_number}</p>
                        )}
                        <p className="text-sm text-slate-500 mt-1">{asset.site?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <AssetHealthBadge asset={asset} />
                      {asset.next_pm_due && (
                        <p className="text-xs text-slate-500 mt-2">
                          PM: {asset.next_pm_due.split("T")[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedAsset && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedAsset.name}</SheetTitle>
                <SheetDescription>
                  {selectedAsset.make} {selectedAsset.model}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Health Status</span>
                  <AssetHealthBadge asset={selectedAsset} />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Serial Number</p>
                      <p className="font-medium font-mono">{selectedAsset.serial_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Location</p>
                      <p className="font-medium">{selectedAsset.site?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Install Date</p>
                      <p className="font-medium">{selectedAsset.install_date?.split("T")[0] || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Warranty Expiry</p>
                      <p className="font-medium">{selectedAsset.warranty_expiry?.split("T")[0] || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Refrigerant Type</p>
                      <p className="font-medium">{selectedAsset.refrigerant_type || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">PM Interval</p>
                      <p className="font-medium">{selectedAsset.pm_interval_months ? `${selectedAsset.pm_interval_months} months` : "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Maintenance Schedule</h3>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Next PM Due</p>
                        <p className="font-medium">{selectedAsset.next_pm_due?.split("T")[0] || "Not scheduled"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Last Service</p>
                        <p className="font-medium">{selectedAsset.last_service_date?.split("T")[0] || "No record"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAsset.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">Notes</h3>
                    <p className="text-sm text-slate-600">{selectedAsset.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const CustomerPortalHistory = () => {
  const { portalApi } = usePortal();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("timeline");

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

  const typeLabels = { 
    breakdown: "Breakdown", 
    pm_service: "PM Service", 
    install: "Installation", 
    quote_visit: "Quote Visit" 
  };

  const typeColors = {
    breakdown: { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" },
    pm_service: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
    install: { bg: "bg-cyan-100", text: "text-cyan-600", border: "border-cyan-200" },
    quote_visit: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="portal-history">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service History</h1>
          <p className="text-slate-500">All completed service visits</p>
        </div>
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            Timeline
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <History className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No service history yet</p>
          </CardContent>
        </Card>
      ) : viewMode === "timeline" ? (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-6">
            {jobs.map((job) => {
              const colors = typeColors[job.job_type] || typeColors.pm_service;
              return (
                <div key={job.id} className="relative pl-10">
                  <div className={`absolute left-2 top-2 h-5 w-5 rounded-full ${colors.bg} border-2 border-white shadow-sm flex items-center justify-center`}>
                    <CheckCircle className={`h-3 w-3 ${colors.text}`} />
                  </div>
                  <Card className={`${colors.border} border`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${colors.bg} ${colors.text}`}>
                              {typeLabels[job.job_type] || job.job_type}
                            </Badge>
                            <span className="font-mono text-sm text-slate-500">{job.job_number}</span>
                          </div>
                          <p className="font-semibold text-slate-900 mt-1">{job.description}</p>
                        </div>
                        <p className="text-sm text-slate-500">{job.updated_at?.split("T")[0]}</p>
                      </div>
                      {job.completion_notes && (
                        <div className="p-3 bg-slate-50 rounded-lg text-sm mt-3">
                          <p className="font-medium text-slate-700 mb-1">Engineer Notes:</p>
                          <p className="text-slate-600">{job.completion_notes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        <span>{job.site?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const colors = typeColors[job.job_type] || typeColors.pm_service;
            return (
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
            );
          })}
        </div>
      )}
    </div>
  );
};

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
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const overdue = schedule.filter((s) => s.is_overdue);
  const upcoming = schedule.filter((s) => !s.is_overdue);

  return (
    <div className="space-y-6" data-testid="portal-pm-schedule">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">PM Schedule</h1>
        <p className="text-slate-500">Upcoming preventive maintenance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{overdue.length}</p>
            <p className="text-sm text-red-600">Overdue</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-700">{upcoming.length}</p>
            <p className="text-sm text-emerald-600">Upcoming</p>
          </CardContent>
        </Card>
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
            <Card key={item.asset_id} className="hover:shadow-md transition-shadow">
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

  const statusColors = { 
    unpaid: "bg-amber-100 text-amber-800", 
    paid: "bg-emerald-100 text-emerald-800", 
    overdue: "bg-red-100 text-red-800" 
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="portal-invoices">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
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
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-cyan-600">{invoice.invoice_number}</p>
                    <p className="text-sm text-slate-500">Due: {invoice.due_date?.split("T")[0]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      {typeof invoice.total === 'number' ? `£${invoice.total.toFixed(2)}` : 'N/A'}
                    </p>
                    <Badge className={statusColors[invoice.status] || statusColors.unpaid}>
                      {invoice.status}
                    </Badge>
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

export const CustomerPortalApprovals = () => {
  const { portalApi } = usePortal();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await portalApi.get("/portal/quotes");
      setQuotes(res.data || []);
    } catch (error) {
      console.log("Quotes endpoint not available yet");
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (quoteId) => {
    try {
      await portalApi.post(`/portal/quotes/${quoteId}/approve`);
      toast.success("Quote approved successfully!");
      fetchQuotes();
    } catch (error) {
      toast.error("Failed to approve quote");
    }
  };

  const handleQuery = async () => {
    toast.info("Query feature coming soon");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="portal-approvals">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approvals</h1>
        <p className="text-slate-500">Quotes awaiting your approval</p>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <FileCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No quotes pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      <span className="font-mono text-sm text-slate-500">{quote.quote_number}</span>
                    </div>
                    <p className="font-semibold text-slate-900">{quote.description || "Quote"}</p>
                    <p className="text-sm text-slate-500">{quote.site?.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Valid until: {quote.valid_until?.split("T")[0]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {typeof quote.total === 'number' ? `£${quote.total.toFixed(2)}` : 'N/A'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuery()}
                      >
                        <HelpCircle className="h-4 w-4 mr-1" />
                        Query
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(quote.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedQuote && (
            <>
              <SheetHeader>
                <SheetTitle>Quote {selectedQuote.quote_number}</SheetTitle>
                <SheetDescription>
                  Review quote details
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {typeof selectedQuote.total === 'number' ? `£${selectedQuote.total.toFixed(2)}` : 'N/A'}
                  </p>
                </div>

                {selectedQuote.lines && selectedQuote.lines.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">Line Items</h3>
                    <div className="space-y-2">
                      {selectedQuote.lines.map((line, index) => (
                        <div key={index} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                          <span>{line.description}</span>
                          <span className="font-medium">£{line.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuote.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">Notes</h3>
                    <p className="text-sm text-slate-600">{selectedQuote.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleQuery()}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Query
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleApprove(selectedQuote.id);
                      setSelectedQuote(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
