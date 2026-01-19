import { useState, useEffect, useCallback } from "react";
import { api } from "../App";

export const useReportsData = (dateRange) => {
  const [data, setData] = useState({
    stats: null,
    jobsByStatus: {},
    jobsByEngineer: [],
    pmDueList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateRange?.from) {
        params.start_date = dateRange.from.toISOString().split("T")[0];
      }
      if (dateRange?.to) {
        params.end_date = dateRange.to.toISOString().split("T")[0];
      }

      const [statsRes, statusRes, engineerRes, pmRes] = await Promise.all([
        api.get("/dashboard/stats", { params }),
        api.get("/reports/jobs-by-status"),
        api.get("/reports/jobs-by-engineer"),
        api.get("/reports/pm-due-list"),
      ]);

      setData({
        stats: statsRes.data,
        jobsByStatus: statusRes.data,
        jobsByEngineer: engineerRes.data,
        pmDueList: pmRes.data,
      });
    } catch (err) {
      console.error("Failed to fetch reports data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useReportsData;
