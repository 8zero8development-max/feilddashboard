import { createContext, useContext, useState, useCallback } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from "date-fns";

const DashboardFilterContext = createContext(null);

export const useDashboardFilter = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error("useDashboardFilter must be used within a DashboardFilterProvider");
  }
  return context;
};

const presets = {
  thisWeek: {
    label: "This Week",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  thisMonth: {
    label: "This Month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  last7Days: {
    label: "Last 7 Days",
    getRange: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  last30Days: {
    label: "Last 30 Days",
    getRange: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  last90Days: {
    label: "Last 90 Days",
    getRange: () => ({
      from: subDays(new Date(), 90),
      to: new Date(),
    }),
  },
};

export const DashboardFilterProvider = ({ children }) => {
  const [dateRange, setDateRange] = useState(() => presets.last30Days.getRange());
  const [activePreset, setActivePreset] = useState("last30Days");

  const selectPreset = useCallback((presetKey) => {
    const preset = presets[presetKey];
    if (preset) {
      setDateRange(preset.getRange());
      setActivePreset(presetKey);
    }
  }, []);

  const setCustomRange = useCallback((range) => {
    setDateRange(range);
    setActivePreset("custom");
  }, []);

  const formatDateRange = useCallback(() => {
    if (!dateRange.from) return "Select date range";
    if (!dateRange.to) return format(dateRange.from, "MMM d, yyyy");
    return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  }, [dateRange]);

  const getApiDateParams = useCallback(() => {
    return {
      start_date: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      end_date: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    };
  }, [dateRange]);

  const value = {
    dateRange,
    setDateRange: setCustomRange,
    activePreset,
    selectPreset,
    presets,
    formatDateRange,
    getApiDateParams,
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
};

export default DashboardFilterProvider;
