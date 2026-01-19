import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./lib/queryClient";
import { initSyncManager } from "./lib/syncManager";

// Pages - Lazy imports for better loading
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Customers from "./pages/Customers";
import Sites from "./pages/Sites";
import Assets from "./pages/Assets";
import Scheduler from "./pages/Scheduler";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Parts from "./pages/Parts";
import Users from "./pages/Users";
import { EngineerLayout, JobsList, JobSheet } from "./pages/engineer";
import Layout from "./components/Layout";
import PMAutomation from "./pages/PMAutomation";
import PortalAccess from "./pages/PortalAccess";
import Help from "./pages/Help";
import FGasCompliance from "./pages/FGasCompliance";
import CustomerPortalLogin from "./pages/CustomerPortalLogin";
import {
  CustomerPortalLayout,
  CustomerPortalDashboard,
  CustomerPortalSites,
  CustomerPortalAssets,
  CustomerPortalHistory,
  CustomerPortalPMSchedule,
  CustomerPortalInvoices,
  CustomerPortalApprovals,
} from "./pages/CustomerPortal";

// Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// API instance with auth
const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { api, API };

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (email, password, name, role) => {
    const response = await api.post("/auth/register", { email, password, name, role });
    const { token, user: userData } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Mobile Detection Hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

initSyncManager();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="craven-theme">
        <AuthProvider>
          <BrowserRouter>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground p-3 z-50 rounded-md">
              Skip to main content
            </a>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Customer Portal Routes */}
              <Route path="/portal" element={<CustomerPortalLogin />} />
              <Route path="/portal/*" element={<CustomerPortalLayout />}>
                <Route path="dashboard" element={<CustomerPortalDashboard />} />
                              <Route path="sites" element={<CustomerPortalSites />} />
                              <Route path="assets" element={<CustomerPortalAssets />} />
                              <Route path="history" element={<CustomerPortalHistory />} />
                              <Route path="pm-schedule" element={<CustomerPortalPMSchedule />} />
                              <Route path="invoices" element={<CustomerPortalInvoices />} />
                              <Route path="approvals" element={<CustomerPortalApprovals />} />
                            </Route>
              
              {/* Engineer Mobile App */}
              <Route path="/engineer" element={
                <ProtectedRoute>
                  <EngineerLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/engineer/jobs" replace />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="jobs/:jobId" element={<JobSheet />} />
              </Route>
              
              {/* Main Office App */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="jobs/:id" element={<JobDetail />} />
                <Route path="customers" element={<Customers />} />
                <Route path="sites" element={<Sites />} />
                <Route path="assets" element={<Assets />} />
                <Route path="scheduler" element={<Scheduler />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="reports" element={<Reports />} />
                <Route path="parts" element={<Parts />} />
                <Route path="users" element={<Users />} />
                <Route path="pm-automation" element={<PMAutomation />} />
                <Route path="portal-access" element={<PortalAccess />} />
                <Route path="fgas-compliance" element={<FGasCompliance />} />
                <Route path="help" element={<Help />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
