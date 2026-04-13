import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem, getStockStatus } from "./types";

interface Props {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (operatorName: string, purpose: string, qtyUsed: number) => void;
  isOperator: boolean;
}

export const UseMaterialModal = ({ item, open, onClose, onSubmit, isOperator }: Props) => {
  const [operatorName, setOperatorName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [qtyUsed, setQtyUsed] = useState(1);

  if (!item) return null;

  const handleSubmit = () => {
    if (!operatorName.trim() || !purpose.trim() || qtyUsed <= 0 || qtyUsed > item.qty) return;
    onSubmit(operatorName.trim(), purpose.trim(), qtyUsed);
    setOperatorName("");
    setPurpose("");
    setQtyUsed(1);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setOperatorName(""); setPurpose(""); setQtyUsed(1); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-sm font-semibold">Use Material – {item.code}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm border border-border p-3">
            <div><span className="text-muted-foreground text-xs">Item Code</span><p className="font-medium">{item.code}</p></div>
            <div><span className="text-muted-foreground text-xs">Description</span><p className="font-medium">{item.desc}</p></div>
            <div><span className="text-muted-foreground text-xs">Available Qty</span><p className="font-medium">{item.qty}</p></div>
            <div><span className="text-muted-foreground text-xs">Status</span><p className="font-medium">{getStockStatus(item.qty, item.minQty)}</p></div>
          </div>
          <div>
            <Label className="text-xs">Operator Name <span className="text-destructive">*</span></Label>
            <Input className="mt-1" placeholder="Enter operator name" value={operatorName} onChange={e => setOperatorName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Quantity Used <span className="text-destructive">*</span></Label>
            <Input className="mt-1" type="number" min={1} max={item.qty} value={qtyUsed} onChange={e => setQtyUsed(Number(e.target.value))} />
            {qtyUsed > item.qty && <p className="text-xs text-destructive mt-1">Cannot exceed available quantity.</p>}
          </div>
          <div>
            <Label className="text-xs">Purpose of Usage <span className="text-destructive">*</span></Label>
            <Textarea className="mt-1" placeholder="Enter purpose" value={purpose} onChange={e => setPurpose(e.target.value)} rows={3} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!operatorName.trim() || !purpose.trim() || qtyUsed <= 0 || qtyUsed > item.qty}>
            Submit Usage
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
