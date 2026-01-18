import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../App";
import { PoundSterling } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              £{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ dateRange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ invoiced: 0, collected: 0 });

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/invoices");
      const invoices = response.data;

      const startDate = dateRange?.from || subDays(new Date(), 30);
      const endDate = dateRange?.to || new Date();

      const days = eachDayOfInterval({ start: startDate, end: endDate });

      let totalInvoiced = 0;
      let totalCollected = 0;

      const chartData = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayInvoices = invoices.filter((inv) => {
          const invDate = inv.created_at?.split("T")[0];
          return invDate === dayStr;
        });

        const invoiced = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const collected = dayInvoices
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + (inv.total || 0), 0);

        totalInvoiced += invoiced;
        totalCollected += collected;

        return {
          date: format(day, "MMM d"),
          fullDate: dayStr,
          invoiced,
          collected,
        };
      });

      setData(chartData);
      setTotals({ invoiced: totalInvoiced, collected: totalCollected });
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-primary" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-primary" />
            Revenue Overview
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Invoiced:</span>
              <span className="font-semibold text-foreground">
                £{totals.invoiced.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Collected:</span>
              <span className="font-semibold text-foreground">
                £{totals.collected.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="h-[300px]"
          role="img"
          aria-label={`Revenue chart showing £${totals.invoiced.toLocaleString()} invoiced and £${totals.collected.toLocaleString()} collected`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `£${value}`}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="invoiced"
                name="Invoiced"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#invoicedGradient)"
              />
              <Area
                type="monotone"
                dataKey="collected"
                name="Collected"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#collectedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
