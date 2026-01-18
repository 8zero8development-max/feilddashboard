import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Building2, Lock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const CustomerPortalLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", access_code: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/portal/login`, form);
      const { token, customer_name, contact_name } = response.data;
      
      localStorage.setItem("portal_token", token);
      localStorage.setItem("portal_customer", customer_name);
      localStorage.setItem("portal_contact", contact_name);
      
      toast.success(`Welcome, ${contact_name}!`);
      navigate("/portal/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://customer-assets.emergentagent.com/job_coolflow-1/artifacts/jqw8kykt_craven-logo-DmU1mTeU.png"
            alt="Craven Cooling Services"
            className="h-20 w-20 mb-4"
          />
          <h1 className="text-2xl font-bold text-white heading">Customer Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Craven Cooling Services Ltd</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-400" />
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-400">
              Access your service history and PM schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  data-testid="portal-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access_code" className="text-slate-300">Access Code</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="access_code"
                    type="text"
                    placeholder="XXXXXXXX"
                    value={form.access_code}
                    onChange={(e) => setForm({ ...form, access_code: e.target.value.toUpperCase() })}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 pl-10 uppercase tracking-widest"
                    maxLength={8}
                    data-testid="portal-code-input"
                  />
                </div>
                <p className="text-xs text-slate-500">Enter the 8-character code provided by Craven Cooling</p>
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={isLoading}
                data-testid="portal-login-btn"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Need access? Contact us at <span className="text-cyan-400">info@cravencooling.co.uk</span>
        </p>
      </div>
    </div>
  );
};

export default CustomerPortalLogin;
