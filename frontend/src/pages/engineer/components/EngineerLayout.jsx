import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../App";
import { Button } from "../../../components/ui/button";
import { useOnlineStatus } from "../../../lib/hooks/useEngineerData";
import {
  Wrench,
  Home,
  User,
  LogOut,
  WifiOff,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function EngineerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isJobsActive = location.pathname === '/engineer' || location.pathname === '/engineer/jobs' || location.pathname.startsWith('/engineer/jobs/');

  return (
    <div className="min-h-screen bg-slate-900 text-white" data-testid="engineer-mobile">
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Offline Mode - Changes will sync when online
        </div>
      )}

      {showInstallPrompt && (
        <div className="bg-cyan-600 text-white text-center py-2 text-sm flex items-center justify-center gap-2">
          <Download className="h-4 w-4" />
          <span>Install app for better experience</span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-2 h-6 text-xs"
            onClick={handleInstall}
          >
            Install
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs text-white/80 hover:text-white"
            onClick={() => setShowInstallPrompt(false)}
          >
            Later
          </Button>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
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

      <main className="pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-4 py-2 z-40">
        <div className="flex justify-around">
          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 ${isJobsActive ? "text-cyan-400" : "text-slate-400"}`}
            onClick={() => navigate("/engineer/jobs")}
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
    </div>
  );
}
