import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

const StatCardSkeleton = () => (
  <Card className="bg-card/80 backdrop-blur-sm border-border">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </CardContent>
  </Card>
);

const ChartCardSkeleton = ({ height = "h-[300px]" }) => (
  <Card className="bg-card/80 backdrop-blur-sm border-border">
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className={`w-full ${height}`} />
    </CardContent>
  </Card>
);

const JobCardSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  </div>
);

const ActivityItemSkeleton = () => (
  <div className="flex items-start gap-3 p-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      {/* Date Range Filter Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>

      {/* Hero Section - Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Trend Section - Revenue Chart */}
        <div className="lg:col-span-8">
          <ChartCardSkeleton height="h-[350px]" />
        </div>

        {/* Job Status Chart */}
        <div className="lg:col-span-4">
          <ChartCardSkeleton height="h-[350px]" />
        </div>

        {/* Workload Heatmap */}
        <div className="lg:col-span-8">
          <ChartCardSkeleton height="h-[200px]" />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { DashboardSkeleton, StatCardSkeleton, ChartCardSkeleton, JobCardSkeleton, ActivityItemSkeleton };
export default DashboardSkeleton;
