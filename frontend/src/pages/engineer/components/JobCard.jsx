import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { MapPin, Clock } from "lucide-react";

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-500 text-white",
};

const statusColors = {
  pending: "bg-amber-100 text-amber-800",
  travelling: "bg-purple-100 text-purple-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const typeLabels = {
  breakdown: "Breakdown",
  pm_service: "PM Service",
  install: "Install",
  quote_visit: "Quote Visit",
};

export default function JobCard({ job, customer, site, onClick }) {
  return (
    <Card
      className="bg-slate-800 border-slate-700 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
      data-testid={`mobile-job-card-${job.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-sm text-cyan-400">{job.job_number}</p>
            <p className="font-semibold">{customer?.company_name}</p>
          </div>
          <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="truncate">{site?.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span>{job.scheduled_date} {job.scheduled_time}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
          <Badge variant="outline" className="text-xs">{typeLabels[job.job_type]}</Badge>
          <Badge className={statusColors[job.status]}>{job.status?.replace("_", " ")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobCardSkeleton() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
          <div className="h-5 w-20 bg-slate-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-700 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
