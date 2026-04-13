import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { TransactionLog } from "./types";

interface Props {
  itemCode: string;
  logs: TransactionLog[];
  open: boolean;
  onClose: () => void;
}

export const HistoryModal = ({ itemCode, logs, open, onClose }: Props) => {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = logs.filter(l => {
    const matchSearch = (l.operatorName || "").toLowerCase().includes(search.toLowerCase());
    const matchFrom = !dateFrom || l.date >= dateFrom;
    const matchTo = !dateTo || l.date <= dateTo;
    return matchSearch && matchFrom && matchTo;
  });

  const totalUsed = filtered.reduce((s, l) => s + (l.qty || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle className="text-sm font-semibold">Inventory History – {itemCode}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search operator..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">From</Label>
            <Input type="date" className="h-8 text-xs w-32" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">To</Label>
            <Input type="date" className="h-8 text-xs w-32" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="overflow-auto flex-1 mt-3">
          <table className="data-table">
  <thead>
    <tr>
      <th>User / Operator</th>
      <th>Action</th>
      <th>Previous</th>
      <th>Added</th>
      <th>Total</th>
      <th>Used</th>
      <th>Purpose</th>
      <th>Date</th>
      <th>Time</th>
    </tr>
  </thead>

  <tbody>
    {filtered.length === 0 ? (
      <tr>
        <td colSpan={9} className="text-center text-sm text-muted-foreground py-8">
          No records available.
        </td>
      </tr>
    ) : (
      filtered.map(log => (
        <tr key={log.id}>

          {/* USER */}
          <td>{log.operatorName || "-"}</td>

          {/* ACTION */}
          <td>
            {log.type === "PURCHASE" ? "Stock Added" : "Material Used"}
          </td>

          {/* PREVIOUS */}
          <td>{log.type === "PURCHASE" ? log.previous : "-"}</td>

          {/* ADDED */}
          <td>{log.type === "PURCHASE" ? log.added : "-"}</td>

          {/* TOTAL */}
          <td>{log.type === "PURCHASE" ? log.total : "-"}</td>

          {/* USED */}
          <td>{log.type === "USAGE" ? log.qty : "-"}</td>

          {/* PURPOSE */}
          <td>{log.type === "USAGE" ? log.purpose : "-"}</td>

          {/* DATE */}
          <td>{log.date || "-"}</td>

          {/* TIME */}
          <td>{log.time || "-"}</td>

        </tr>
      ))
    )}
  </tbody>
</table>
        </div>
        <div className="border-t border-border pt-3 mt-2 text-xs text-muted-foreground flex justify-between">
          <span>Showing {filtered.length} records</span>
          <span className="font-medium text-foreground">Total Quantity Used: {totalUsed}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
