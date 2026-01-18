import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Navigation,
  Play,
  Pause,
  Building2,
  Wrench,
  Thermometer,
  Phone,
} from "lucide-react";

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-500 text-white",
};

export default function DetailsTab({ job, site, assets, onStatusChange }) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={job?.status === "travelling" ? "default" : "outline"}
          className={job?.status === "travelling" ? "bg-purple-600" : ""}
          onClick={() => onStatusChange("travelling")}
          data-testid="status-travelling-btn"
        >
          <Navigation className="h-4 w-4 mr-1" />
          Travel
        </Button>
        <Button
          variant={job?.status === "in_progress" ? "default" : "outline"}
          className={job?.status === "in_progress" ? "bg-cyan-600" : ""}
          onClick={() => onStatusChange("in_progress")}
          data-testid="status-progress-btn"
        >
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
        <Button
          variant="outline"
          onClick={() => onStatusChange("pending")}
          data-testid="status-pause-btn"
        >
          <Pause className="h-4 w-4 mr-1" />
          Pause
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Site Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {site ? (
            <>
              <p className="font-medium">{site.name}</p>
              <p className="text-sm text-slate-300">{site.address}</p>
              {site.access_notes && (
                <div className="p-3 bg-amber-500/20 rounded-lg text-sm">
                  <p className="font-medium text-amber-400 mb-1">Access Notes:</p>
                  <p className="text-slate-300">{site.access_notes}</p>
                </div>
              )}
              {site.contact_phone && (
                <a
                  href={`tel:${site.contact_phone}`}
                  className="flex items-center gap-2 p-3 bg-cyan-600/20 rounded-lg text-cyan-400"
                >
                  <Phone className="h-4 w-4" />
                  Call Site: {site.contact_phone}
                </a>
              )}
            </>
          ) : (
            <p className="text-slate-400">No site information available</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Job Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-200">{job?.description || "No description provided"}</p>
        </CardContent>
      </Card>

      {assets && assets.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Thermometer className="h-4 w-4" /> Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assets.map((asset) => (
              <div key={asset.id} className="p-3 bg-slate-700 rounded-lg">
                <p className="font-medium">{asset.name}</p>
                <p className="text-sm text-slate-400">
                  {asset.make} {asset.model} {asset.serial_number && `• S/N: ${asset.serial_number}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
