import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Clock, Camera, PenTool, CheckCircle2, X } from "lucide-react";

export default function CompletionTab({
  engineerNotes,
  setEngineerNotes,
  travelTime,
  setTravelTime,
  timeOnSite,
  setTimeOnSite,
  photos,
  setPhotos,
  onPhotoCapture,
  onComplete,
}) {
  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, idx) => idx !== index));
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400">Travel (mins)</Label>
              <Input
                type="number"
                value={travelTime}
                onChange={(e) => setTravelTime(parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600"
                data-testid="travel-time-input"
              />
            </div>
            <div>
              <Label className="text-slate-400">On Site (mins)</Label>
              <Input
                type="number"
                value={timeOnSite}
                onChange={(e) => setTimeOnSite(parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600"
                data-testid="onsite-time-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-400" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => handleRemovePhoto(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoCapture}
            />
            <Button variant="outline" className="w-full" asChild>
              <span>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-cyan-400" />
            Engineer Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe work completed, any issues found, recommendations..."
            value={engineerNotes}
            onChange={(e) => setEngineerNotes(e.target.value)}
            className="bg-slate-700 border-slate-600 min-h-[120px]"
            data-testid="engineer-notes-input"
          />
        </CardContent>
      </Card>

      <Button
        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-lg"
        onClick={onComplete}
        data-testid="complete-job-btn"
      >
        <CheckCircle2 className="h-5 w-5 mr-2" />
        Complete Job
      </Button>
    </div>
  );
}
