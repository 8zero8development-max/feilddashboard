import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Package, X } from "lucide-react";

export default function PartsTab({ partsUsed, availableParts, onAddPart, onRemovePart }) {
  return (
    <div className="p-4 space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-400" />
            Parts Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partsUsed.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No parts added</p>
          ) : (
            <div className="space-y-2">
              {partsUsed.map((part) => (
                <div key={part.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-slate-400">Qty: {part.quantity}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemovePart(part.id)}
                    className="text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm text-slate-400">Add Part</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {availableParts?.map((part) => (
                <Button
                  key={part.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => onAddPart(part)}
                  data-testid={`add-part-${part.id}`}
                >
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-xs text-slate-400">{part.part_number} • £{part.unit_price}</p>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
