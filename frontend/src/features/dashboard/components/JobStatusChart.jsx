import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { api } from "../../../App";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const STATUS_COLORS = {
  pending: { color: "#f59e0b", label: "Pending" },
  in_progress: { color: "#06b6d4", label: "In Progress" },
  travelling: { color: "#8b5cf6", label: "Travelling" },
  completed: { color: "#10b981", label: "Completed" },
  cancelled: { color: "#ef4444", label: "Cancelled" },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-foreground">{data.name}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {data.value} jobs ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, onLegendClick }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <button
          key={index}
          onClick={() => onLegendClick(entry.payload.status)}
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
          <span className="text-sm font-medium text-foreground">
            ({entry.payload.value})
          </span>
        </button>
      ))}
    </div>
  );
};

const JobStatusChart = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/reports/jobs-by-status");
      const statusCounts = response.data;

      let totalJobs = 0;
      const chartData = Object.entries(statusCounts).map(([status, count]) => {
        totalJobs += count;
        return {
          status,
          name: STATUS_COLORS[status]?.label || status.replace("_", " "),
          value: count,
          color: STATUS_COLORS[status]?.color || "#94a3b8",
        };
      });

      chartData.forEach((item) => {
        item.percentage = totalJobs > 0 ? Math.round((item.value / totalJobs) * 100) : 0;
      });

      setData(chartData);
      setTotal(totalJobs);
    } catch (error) {
      console.error("Failed to fetch job status data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSliceClick = (data) => {
    if (data && data.status) {
      navigate(`/jobs?status=${data.status}`);
    }
  };

  const handleLegendClick = (status) => {
    navigate(`/jobs?status=${status}`);
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Job Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[280px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg heading flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Job Status
          </CardTitle>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="h-[280px]"
          role="img"
          aria-label={`Job status distribution chart showing ${data.map((d) => `${d.value} ${d.name}`).join(", ")}`}
        >
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={handleSliceClick}
                  style={{ cursor: "pointer" }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={<CustomLegend onLegendClick={handleLegendClick} />}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No job data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobStatusChart;
