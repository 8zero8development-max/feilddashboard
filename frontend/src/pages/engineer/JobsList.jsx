import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Wrench } from "lucide-react";
import { useEngineerJobs, useEngineerLookups } from "../../lib/hooks/useEngineerData";
import JobCard, { JobCardSkeleton } from "./components/JobCard";

export default function JobsList() {
  const navigate = useNavigate();
  const { data: jobsData, isLoading: jobsLoading } = useEngineerJobs();
  const { data: lookups, isLoading: lookupsLoading } = useEngineerLookups();

  const jobs = Array.isArray(jobsData) ? jobsData : [];
  const isLoading = jobsLoading || lookupsLoading;

  const getCustomer = (customerId) => lookups?.customers?.find((c) => c.id === customerId);
  const getSite = (siteId) => lookups?.sites?.find((s) => s.id === siteId);

  const handleJobClick = (job) => {
    navigate(`/engineer/jobs/${job.id}`);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 bg-slate-700 rounded animate-pulse" />
          <div className="h-6 w-20 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold heading">My Jobs</h1>
        <Badge variant="outline" className="border-cyan-500 text-cyan-400">
          {jobs?.length || 0} assigned
        </Badge>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No jobs assigned</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              customer={getCustomer(job.customer_id)}
              site={getSite(job.site_id)}
              onClick={() => handleJobClick(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
