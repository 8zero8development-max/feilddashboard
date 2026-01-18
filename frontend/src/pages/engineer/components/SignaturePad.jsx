import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

export default function SignaturePad({ open, onOpenChange, onSubmit }) {
  const sigCanvas = useRef(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = () => {
    const signatureData = sigCanvas.current?.toDataURL();
    onSubmit(signatureData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="heading">Customer Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-white rounded-lg overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                width: 350,
                height: 200,
                className: "signature-canvas",
              }}
              data-testid="signature-canvas"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
              data-testid="submit-signature-btn"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
