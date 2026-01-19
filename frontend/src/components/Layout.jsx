import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useTheme } from "./ThemeProvider";
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
import { Sheet, SheetContent } from "./ui/sheet";
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
  RefreshCw,
  Key,
  Sun,
  Moon,
  HelpCircle,
  Snowflake,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", path: "/jobs", icon: Wrench },
  { name: "Scheduler", path: "/scheduler", icon: Calendar },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Sites", path: "/sites", icon: MapPin },
  { name: "Assets", path: "/assets", icon: Thermometer },
  { name: "F-Gas Compliance", path: "/fgas-compliance", icon: Snowflake },
  { name: "Quotes", path: "/quotes", icon: FileText },
  { name: "Invoices", path: "/invoices", icon: Receipt },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Parts", path: "/parts", icon: Package },
  { name: "Users", path: "/users", icon: UserCog },
  { name: "PM Automation", path: "/pm-automation", icon: RefreshCw },
  { name: "Customer Portal", path: "/portal-access", icon: Key },
  { name: "Help", path: "/help", icon: HelpCircle },
];

const NavLink = ({ item, isActive, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <img
          src="/craven-logo.png"
          alt="Craven Cooling"
          className="h-10 w-10"
        />
        <div>
          <h1 className="text-lg font-bold text-foreground heading">Craven Cooling</h1>
          <p className="text-xs text-muted-foreground">Field Service</p>
        </div>
      </div>

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

      <div className="px-3 py-4 border-t border-border">
        <Link
          to="/engineer"
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all duration-200"
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

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full transition-all duration-300 hover:bg-muted"
      data-testid="theme-toggle"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform duration-300 rotate-0 scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-50">
        <Sidebar />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card border-border">
          <Sidebar onNavClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 lg:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground heading" data-testid="page-title">
              {navItems.find((item) => location.pathname.startsWith(item.path))?.name || "Dashboard"}
            </h2>
          </div>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu-btn">
                <Avatar className="h-10 w-10 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-primary capitalize font-medium">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive" data-testid="logout-btn">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background" tabIndex="-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
