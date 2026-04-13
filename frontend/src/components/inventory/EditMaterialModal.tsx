import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem, MAINTENANCE_CATEGORIES } from "./types";

interface Props {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: InventoryItem, old: InventoryItem) => void;
}

export const EditMaterialModal = ({ item, open, onClose, onSave }: Props) => {
  const [form, setForm] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    if (item) {
      setForm({ ...item });
    }
  }, [item]);

  if (!item) return null;

  const cupboard = form.cupboard || "";
  const rack = form.location?.split(" / ")[1] || "";

  const handleSave = () => {
    const qty = Number(form.qty);
    const minQty = Number(form.minQty);
    if (qty < 0 || minQty < 0) return;
    onSave({ ...item, ...form, qty, minQty, location: `${cupboard} / ${rack}` } as InventoryItem, item);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-sm font-semibold">Edit Material – {item.code}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Item Code</Label><Input className="mt-1" value={item.code} disabled /></div>
            <div><Label className="text-xs">Description</Label><Input className="mt-1" value={form.desc || ""} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} /></div>
            <div><Label className="text-xs">Machine Name</Label><Input className="mt-1" value={form.machine || ""} onChange={e => setForm(p => ({ ...p, machine: e.target.value }))} /></div>
            <div><Label className="text-xs">Cupboard No.</Label><Input className="mt-1" value={cupboard} onChange={e => setForm(p => ({ ...p, cupboard: e.target.value }))} /></div>
            <div><Label className="text-xs">Rack No.</Label><Input className="mt-1" value={rack} onChange={e => setForm(p => ({ ...p, location: `${cupboard} / ${e.target.value}` }))} /></div>
            <div><Label className="text-xs">Quantity</Label><Input className="mt-1" type="number" min={0} value={form.qty ?? ""} onChange={e => setForm(p => ({ ...p, qty: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Min Required Qty</Label><Input className="mt-1" type="number" min={0} value={form.minQty ?? ""} onChange={e => setForm(p => ({ ...p, minQty: Number(e.target.value) }))} /></div>
            <div>
              <Label className="text-xs">Maintenance Category</Label>
              <Select value={form.maintenanceCategory || ""} onValueChange={v => setForm(p => ({ ...p, maintenanceCategory: v as any, materialType: v !== "Spare Parts" ? "" : p.materialType }))}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.maintenanceCategory === "Spare Parts" && (
              <div><Label className="text-xs">Material Type</Label><Input className="mt-1" value={form.materialType || ""} onChange={e => setForm(p => ({ ...p, materialType: e.target.value }))} placeholder="e.g. Bearings, Filters" /></div>
            )}
          </div>
          <div className="border-t border-border pt-3">
            <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Vendor Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Vendor Name</Label><Input className="mt-1" value={form.vendor || ""} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} /></div>
              <div><Label className="text-xs">Contact</Label><Input className="mt-1" value={form.vendorContact || ""} onChange={e => setForm(p => ({ ...p, vendorContact: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input className="mt-1" value={form.vendorEmail || ""} onChange={e => setForm(p => ({ ...p, vendorEmail: e.target.value }))} /></div>
              <div><Label className="text-xs">Address</Label><Input className="mt-1" value={form.vendorAddress || ""} onChange={e => setForm(p => ({ ...p, vendorAddress: e.target.value }))} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
