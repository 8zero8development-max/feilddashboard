import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Checkbox } from "../../../../components/ui/checkbox";
import { ClipboardCheck } from "lucide-react";

export default function ChecklistTab({ checklistItems, onToggleItem }) {
  const completedCount = checklistItems.filter((i) => i.completed).length;

  return (
    <div className="p-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-cyan-400" />
            PM Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg touch-target cursor-pointer"
                onClick={() => onToggleItem(item.id)}
                data-testid={`checklist-item-${item.id}`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => onToggleItem(item.id)}
                  className="h-6 w-6"
                />
                <span className={item.completed ? "line-through text-slate-500" : ""}>
                  {item.description}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">
              {completedCount} of {checklistItems.length} completed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
