import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { 
  useEngineerJobs, 
  useEngineerLookups, 
  useUpdateJobStatus, 
  useCompleteJob,
  useJobDraft,
} from "../../lib/hooks/useEngineerData";
import { DetailsTab, ChecklistTab, PartsTab, CompletionTab } from "./components/JobTabs";
import SignaturePad from "./components/SignaturePad";

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-500 text-white",
};

const DEFAULT_CHECKLIST = [
  { id: 1, description: "Check refrigerant pressure", completed: false },
  { id: 2, description: "Inspect compressor operation", completed: false },
  { id: 3, description: "Clean condenser coils", completed: false },
  { id: 4, description: "Check fan motors", completed: false },
  { id: 5, description: "Test thermostat operation", completed: false },
  { id: 6, description: "Inspect electrical connections", completed: false },
  { id: 7, description: "Check door seals", completed: false },
  { id: 8, description: "Record temperatures", completed: false },
];

export default function JobSheet() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const { data: jobs } = useEngineerJobs();
  const { data: lookups } = useEngineerLookups();
  const updateJobStatus = useUpdateJobStatus();
  const completeJob = useCompleteJob();
  const { draft, saveDraft, clearDraft } = useJobDraft(jobId);

  const [engineerNotes, setEngineerNotes] = useState("");
  const [travelTime, setTravelTime] = useState(0);
  const [timeOnSite, setTimeOnSite] = useState(0);
  const [checklistItems, setChecklistItems] = useState(DEFAULT_CHECKLIST);
  const [partsUsed, setPartsUsed] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [showSignature, setShowSignature] = useState(false);
  const [fgasData, setFgasData] = useState({
    refrigerant_added: "",
    refrigerant_recovered: "",
    leak_test_result: "",
    test_method: "",
    technician_certification: "",
  });

  const job = jobs?.find((j) => j.id === jobId);
  const customer = lookups?.customers?.find((c) => c.id === job?.customer_id);
  const site = lookups?.sites?.find((s) => s.id === job?.site_id);
  const jobAssets = lookups?.assets?.filter((a) => job?.asset_ids?.includes(a.id)) || [];
  const hasFgasAssets = jobAssets.some((a) => a.refrigerant_type && a.refrigerant_charge);

  useEffect(() => {
    if (draft) {
      setEngineerNotes(draft.engineerNotes || "");
      setTravelTime(draft.travelTime || 0);
      setTimeOnSite(draft.timeOnSite || 0);
      setChecklistItems(draft.checklistItems || DEFAULT_CHECKLIST);
      setPartsUsed(draft.partsUsed || []);
      setPhotos(draft.photos || []);
    }
  }, [draft]);

  const saveDraftDebounced = useCallback(() => {
    saveDraft({
      engineerNotes,
      travelTime,
      timeOnSite,
      checklistItems,
      partsUsed,
      photos,
    });
  }, [saveDraft, engineerNotes, travelTime, timeOnSite, checklistItems, partsUsed, photos]);

  useEffect(() => {
    const timeoutId = setTimeout(saveDraftDebounced, 1000);
    return () => clearTimeout(timeoutId);
  }, [saveDraftDebounced]);

  const handleStatusChange = (status) => {
    if (!job) return;
    updateJobStatus.mutate({ jobId: job.id, status });
  };

  const handleToggleChecklist = (id) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAddPart = (part) => {
    const existing = partsUsed.find((p) => p.id === part.id);
    if (existing) {
      setPartsUsed(
        partsUsed.map((p) =>
          p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setPartsUsed([...partsUsed, { ...part, quantity: 1 }]);
    }
  };

  const handleRemovePart = (partId) => {
    setPartsUsed(partsUsed.filter((p) => p.id !== partId));
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos([...photos, event.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (!engineerNotes.trim()) {
      toast.error("Please add engineer notes");
      return;
    }
    setShowSignature(true);
  };

  const handleSignatureSubmit = (signatureData) => {
    if (!job) return;

    const completionData = {
      job_id: job.id,
      engineer_notes: engineerNotes,
      travel_time: travelTime,
      time_on_site: timeOnSite,
      parts_used: partsUsed.map((p) => ({ name: p.name, quantity: p.quantity })),
      checklist_items: checklistItems,
      customer_signature: signatureData,
      photos: [],
    };

    completeJob.mutate(
      { jobId: job.id, completionData },
      {
        onSuccess: () => {
          setShowSignature(false);
          clearDraft();
          navigate("/engineer/jobs");
        },
      }
    );
  };

  const handleBack = () => {
    navigate("/engineer/jobs");
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Job not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="sticky top-0 z-40 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-slate-400"
            data-testid="back-to-jobs-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="font-mono text-cyan-400">{job.job_number}</p>
            <p className="text-sm text-slate-400">{customer?.company_name}</p>
          </div>
          <Badge className={priorityColors[job.priority]}>{job.priority}</Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 rounded-none border-b border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">Details</TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-slate-700">Checklist</TabsTrigger>
          <TabsTrigger value="parts" className="data-[state=active]:bg-slate-700">Parts</TabsTrigger>
          <TabsTrigger value="complete" className="data-[state=active]:bg-slate-700">Complete</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsTab
            job={job}
            site={site}
            assets={jobAssets}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistTab
            checklistItems={checklistItems}
            onToggleItem={handleToggleChecklist}
          />
        </TabsContent>

        <TabsContent value="parts">
          <PartsTab
            partsUsed={partsUsed}
            availableParts={lookups?.parts || []}
            onAddPart={handleAddPart}
            onRemovePart={handleRemovePart}
          />
        </TabsContent>

        <TabsContent value="complete">
          <CompletionTab
            engineerNotes={engineerNotes}
            setEngineerNotes={setEngineerNotes}
            travelTime={travelTime}
            setTravelTime={setTravelTime}
            timeOnSite={timeOnSite}
            setTimeOnSite={setTimeOnSite}
            photos={photos}
            setPhotos={setPhotos}
            onPhotoCapture={handlePhotoCapture}
            onComplete={handleComplete}
            fgasData={fgasData}
            setFgasData={setFgasData}
            showFgasSection={hasFgasAssets}
          />
        </TabsContent>
      </Tabs>

      <SignaturePad
        open={showSignature}
        onOpenChange={setShowSignature}
        onSubmit={handleSignatureSubmit}
      />
    </div>
  );
}
