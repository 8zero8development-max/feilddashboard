import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  LayoutDashboard,
  Wrench,
  Users,
  MapPin,
  Thermometer,
  Calendar,
  FileText,
  Receipt,
  BarChart3,
  Package,
  UserCog,
  Menu,
  LogOut,
  ChevronRight,
  Smartphone,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", path: "/jobs", icon: Wrench },
  { name: "Scheduler", path: "/scheduler", icon: Calendar },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Sites", path: "/sites", icon: MapPin },
  { name: "Assets", path: "/assets", icon: Thermometer },
  { name: "Quotes", path: "/quotes", icon: FileText },
  { name: "Invoices", path: "/invoices", icon: Receipt },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Parts", path: "/parts", icon: Package },
  { name: "Users", path: "/users", icon: UserCog },
];

const NavLink = ({ item, isActive, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
      isActive
        ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
    }`}
    data-testid={`nav-${item.name.toLowerCase()}`}
  >
    <item.icon className="h-5 w-5" />
    {item.name}
  </Link>
);

const Sidebar = ({ onNavClick }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <img
          src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
          alt="Craven Cooling"
          className="h-10 w-10"
        />
        <div>
          <h1 className="text-lg font-bold text-white heading">Craven Cooling</h1>
          <p className="text-xs text-slate-500">Field Service</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/")}
              onClick={onNavClick}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Engineer App Link */}
      <div className="px-3 py-4 border-t border-slate-800">
        <Link
          to="/engineer"
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-cyan-400 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition-all"
          data-testid="nav-engineer-app"
        >
          <Smartphone className="h-5 w-5" />
          Engineer App
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Link>
      </div>
    </div>
  );
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-50">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-slate-800">
          <Sidebar onNavClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Page Title - Dynamic based on route */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 heading" data-testid="page-title">
              {navItems.find((item) => location.pathname.startsWith(item.path))?.name || "Dashboard"}
            </h2>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu-btn">
                <Avatar className="h-10 w-10 bg-cyan-600">
                  <AvatarFallback className="bg-cyan-600 text-white">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <p className="text-xs text-cyan-600 capitalize">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
