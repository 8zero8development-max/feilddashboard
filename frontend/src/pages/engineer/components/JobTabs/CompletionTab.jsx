import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Clock, Camera, PenTool, CheckCircle2, X, Snowflake } from "lucide-react";

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
  fgasData,
  setFgasData,
  showFgasSection = false,
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

      {showFgasSection && fgasData && setFgasData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-cyan-400" />
              F-Gas Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Refrigerant Added (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fgasData.refrigerant_added || ""}
                  onChange={(e) => setFgasData({ ...fgasData, refrigerant_added: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-slate-400">Refrigerant Recovered (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fgasData.refrigerant_recovered || ""}
                  onChange={(e) => setFgasData({ ...fgasData, refrigerant_recovered: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Leak Test Result</Label>
                <Select 
                  value={fgasData.leak_test_result || "none"} 
                  onValueChange={(v) => setFgasData({ ...fgasData, leak_test_result: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Tested</SelectItem>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                    <SelectItem value="minor_leak">Minor Leak</SelectItem>
                    <SelectItem value="major_leak">Major Leak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Test Method</Label>
                <Select 
                  value={fgasData.test_method || "none"} 
                  onValueChange={(v) => setFgasData({ ...fgasData, test_method: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="pressure_test">Pressure Test</SelectItem>
                    <SelectItem value="bubble_test">Bubble Test</SelectItem>
                    <SelectItem value="electronic_detector">Electronic Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Technician Certification</Label>
              <Input
                value={fgasData.technician_certification || ""}
                onChange={(e) => setFgasData({ ...fgasData, technician_certification: e.target.value })}
                className="bg-slate-700 border-slate-600"
                placeholder="Certification number"
              />
            </div>
          </CardContent>
        </Card>
      )}

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
