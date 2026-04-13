import axiosInstance from "@/lib/axios";
import { useEffect } from "react";
import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useNotifications } from "@/context/NotificationContext";
import { useAudit } from "@/context/AuditContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parse } from "date-fns";

interface GridRow {
  id: string;
  emp: string;
  date: string;
  h: string[];
}

type Tab = "assign" | "grid" | "history";
const ROWS_PER_PAGE = 10;

const WorkAssignment = () => {
  const { user } = useAuth();
  console.log("Current user:", user);
  const { addNotification } = useNotifications();
  const { addAuditEntry } = useAudit();
  const [tab, setTab] = useState<Tab>("grid");
  const [empFilter, setEmpFilter] = useState("all");
  const [grid, setGrid] = useState<GridRow[]>([]);
  const [history, setHistory] = useState<{ id: string; emp: string; date: string; h: string[] }[]>([]);

  const [todayJobs, setTodayJobs] = useState<string[]>([]);
  const [jobMap, setJobMap] = useState<Record<string, string>>({});
  const [newJobTitle, setNewJobTitle] = useState("");

  const [gridEmpName, setGridEmpName] = useState("");
  const [gridHours, setGridHours] = useState<string[]>(Array(8).fill(""));

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<GridRow | null>(null);

  // History filters
  const [historyStartDate, setHistoryStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [historyEndDate, setHistoryEndDate] = useState<Date | undefined>(new Date());
  const [historyEmpFilter, setHistoryEmpFilter] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  const fetchJobs = async () => {
  try {

    const res = await axiosInstance.get("work/job-titles/today/");

    const titles = res.data.map((j: any) => j.title);

    const map: Record<string,string> = {};
    res.data.forEach((j:any)=>{
      map[j.title] = j.id;
    });

    setTodayJobs(titles);
    setJobMap(map);

  } catch (err) {
    console.error("Failed loading job titles:", err);
  }
};

  const fetchAssignments = async () => {
  try {

    const res = await axiosInstance.get("work/today/");

    const mapped = res.data.map((r: any) => ({
      id: r.id,
      emp: r.employee,
      date: r.date,
      h: [
        r.hours?.["1"] || "",
        r.hours?.["2"] || "",
        r.hours?.["3"] || "",
        r.hours?.["4"] || "",
        r.hours?.["5"] || "",
        r.hours?.["6"] || "",
        r.hours?.["7"] || "",
        r.hours?.["8"] || ""
      ]
    }));

    setGrid(mapped);

  } catch (err) {
    console.error("Failed loading assignments:", err);
  }
};

const fetchHistory = async () => {

  try {

    const res = await axiosInstance.get("work/history/");

    const mapped = res.data.results.map((r: any) => ({
      id: r.id,
      emp: r.employee,
      date: format(new Date(r.date), "dd MMM yyyy"),
      h: [
        r.hours?.["1"] || "",
        r.hours?.["2"] || "",
        r.hours?.["3"] || "",
        r.hours?.["4"] || "",
        r.hours?.["5"] || "",
        r.hours?.["6"] || "",
        r.hours?.["7"] || "",
        r.hours?.["8"] || ""
      ]
    }));

    setHistory(mapped);

  } catch (err) {

    console.error("Failed loading history:", err);

  }

};

useEffect(() => {
  fetchAssignments();
  fetchJobs();
  fetchHistory();
}, []);

  const canEditDelete = user?.role === "High Authority" || user?.role === "Admin" || user?.role === "Manager";
  const todayStr = format(new Date(), "dd MMM yyyy");
  const todayISO = new Date().toISOString().split("T")[0];

  const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);

  const handleAddJob = async () => {

  const title = newJobTitle.trim();

  if (!title) return;

  try {

    await axiosInstance.post("work/job-titles/", {
      title: title
    });

    await fetchJobs(); // reload titles from DB

    setNewJobTitle("");

    addAuditEntry({
      user: user?.name || "Unknown",
      action: `Created job title: ${title}`,
      module: "Work Assignment"
    });

    toast({
      title: "Job title created",
      description: `"${title}" is now available in hour dropdowns.`
    });

  } catch (error) {

    console.error("Failed to create job title:", error);

    toast({
      title: "Error",
      description: "Could not create job title",
      variant: "destructive"
    });

  }

};

  const resetForm = () => {
    setGridEmpName("");
    setGridHours(Array(8).fill(""));
    setEditingId(null);
  };

  const handleSaveGridEntry = async () => {
    if (!gridEmpName.trim() || gridHours.every(h => !h)) return;

    if (editingId) {

  await axiosInstance.put(`work/assign/${editingId}/`, {
    employee_name: gridEmpName.trim(),
    date: todayISO,
    hours: {
  "1": gridHours[0] ? jobMap[gridHours[0]] : null,
  "2": gridHours[1] ? jobMap[gridHours[1]] : null,
  "3": gridHours[2] ? jobMap[gridHours[2]] : null,
  "4": gridHours[3] ? jobMap[gridHours[3]] : null,
  "5": gridHours[4] ? jobMap[gridHours[4]] : null,
  "6": gridHours[5] ? jobMap[gridHours[5]] : null,
  "7": gridHours[6] ? jobMap[gridHours[6]] : null,
  "8": gridHours[7] ? jobMap[gridHours[7]] : null
}
  });

  await fetchAssignments();

  toast({
    title: "Assignment updated",
    description: `Work assignment for ${gridEmpName} updated`
  });


      // Update existing
const handleDeleteConfirm = async () => {

  if (!deleteTarget) return;

  try {

    await axiosInstance.delete(`work/assign/${deleteTarget.id}/delete/`);

    await fetchAssignments();

    toast({
      title: "Assignment deleted",
      description: `Work assignment for ${deleteTarget.emp} removed`
    });

  } catch (err) {

    toast({
      title: "Delete failed",
      description: "Could not delete assignment",
      variant: "destructive"
    });

  }

  setDeleteTarget(null);
};
      setHistory(prev => prev.map(r => r.id === editingId ? { ...r, h: [...gridHours] } : r));
      addAuditEntry({ user: user?.name || "Unknown", action: `Updated work assignment for ${gridEmpName.trim()}`, module: "Work Assignment" });
      toast({ title: "Assignment updated", description: `Work assignment for ${gridEmpName.trim()} has been updated.` });
    } else {

  await axiosInstance.post("work/assign/", {

  employee_name: gridEmpName.trim(),
  date: todayISO,

  hours: {
  "1": gridHours[0] ? jobMap[gridHours[0]] : null,
  "2": gridHours[1] ? jobMap[gridHours[1]] : null,
  "3": gridHours[2] ? jobMap[gridHours[2]] : null,
  "4": gridHours[3] ? jobMap[gridHours[3]] : null,
  "5": gridHours[4] ? jobMap[gridHours[4]] : null,
  "6": gridHours[5] ? jobMap[gridHours[5]] : null,
  "7": gridHours[6] ? jobMap[gridHours[6]] : null,
  "8": gridHours[7] ? jobMap[gridHours[7]] : null
}

});

fetchAssignments();   // reload assignments from database

  setHistory(prev => [
    {
      id: crypto.randomUUID(),
      emp: gridEmpName.trim(),
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      h: [...gridHours]
    },
    ...prev,
  ]);

  addNotification({
    type: "work_assignment",
    data: {
      employeeName: gridEmpName.trim(),
      date: todayISO,
      assignedJobs: [...new Set(gridHours.filter(Boolean))].join(", "),
    },
  });

  addAuditEntry({
    user: user?.name || "Unknown",
    action: `Assigned work to ${gridEmpName.trim()}`,
    module: "Work Assignment"
  });

  toast({
    title: "Assignment saved",
    description: `Work assignment for ${gridEmpName.trim()} has been saved.`
  });

}

    resetForm();
  };

  const handleEditClick = (row: GridRow) => {
    setGridEmpName(row.emp);
    setGridHours([...row.h]);
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setGrid(prev => prev.filter(r => r.id !== deleteTarget.id));
    setHistory(prev => prev.filter(r => r.id !== deleteTarget.id));
    addAuditEntry({ user: user?.name || "Unknown", action: `Deleted work assignment for ${deleteTarget.emp}`, module: "Work Assignment" });
    toast({ title: "Assignment deleted", description: `Work assignment for ${deleteTarget.emp} has been removed.` });
    setDeleteTarget(null);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // History filtering & pagination
  const filteredHistory = useMemo(() => {
    return history.filter(row => {
      if (historyEmpFilter && !row.emp.toLowerCase().includes(historyEmpFilter.toLowerCase())) return false;
      if (historyStartDate || historyEndDate) {
        const rowDate = parse(row.date, "dd MMM yyyy", new Date());
        if (historyStartDate && rowDate < startOfDay(historyStartDate)) return false;
        if (historyEndDate && rowDate > endOfDay(historyEndDate)) return false;
      }
      return true;
    });
  }, [history, historyEmpFilter, historyStartDate, historyEndDate]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / ROWS_PER_PAGE));
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * ROWS_PER_PAGE, historyPage * ROWS_PER_PAGE);

  const clearHistoryFilters = () => {
    setHistoryStartDate(subDays(new Date(), 7));
    setHistoryEndDate(new Date());
    setHistoryEmpFilter("");
    setHistoryPage(1);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "assign", label: "New Assignment" },
    { key: "grid", label: "Work Grid" },
    { key: "history", label: "History" },
  ];

  return (
    <AppLayout>
      <div>
        <div className="flex gap-0 border-b border-border mb-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "assign" && (
          <div className="bg-card border border-border p-5 max-w-lg">
            <h3 className="section-title">Create Job Title for Today</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">New Job Title</Label>
                <Input className="mt-1" placeholder="Enter job title" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddJob()} />
              </div>
              <Button onClick={handleAddJob} disabled={!newJobTitle.trim()}>Add Job Title</Button>
            </div>
            {todayJobs.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-semibold text-foreground mb-2">Today's Available Job Titles ({todayJobs.length})</p>
                <div className="flex flex-wrap gap-2">
                  {todayJobs.map((j, i) => (
                    <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-1 border border-border">{j}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "grid" && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">Today's 8-Hour Work Grid</h3>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 border border-border">
                Today: {todayStr}
              </span>
            </div>

            <div className="border border-border p-4 mb-5">
              <p className="text-xs font-semibold text-foreground mb-3">
                {editingId ? "Edit Assignment" : "Assign Employee Hours"}
              </p>
              <div className="mb-3 max-w-xs">
                <Label className="text-xs">Employee Name</Label>
                <Input
                  className="mt-1"
                  placeholder="Enter employee name"
                  value={gridEmpName}
                  onChange={e => setGridEmpName(e.target.value)}
                  disabled={!!editingId}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i}>
                    <Label className="text-xs">H{i + 1}</Label>
                    <Select value={gridHours[i]} onValueChange={v => setGridHours(prev => prev.map((h, idx) => idx === i ? v : h))}>
                      <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select job" /></SelectTrigger>
                      <SelectContent>
                        {todayJobs.map(j => <SelectItem key={j} value={j} className="text-xs">{j}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveGridEntry}
                  disabled={!gridEmpName.trim() || gridHours.every(h => !h)}
                >
                  {editingId ? "Update Assignment" : "Save to Grid"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    {Array.from({ length: 8 }, (_, i) => <th key={i}>H{i + 1}</th>)}
                    {canEditDelete && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {grid.length === 0 ? (
                    <tr><td colSpan={canEditDelete ? 10 : 9} className="text-center text-sm text-muted-foreground py-8">No assignments for today.</td></tr>
                  ) : grid.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium whitespace-nowrap">{row.emp}</td>
                      {row.h.map((job, i) => (
                        <td key={i} className="min-w-[140px]">
                          <Select defaultValue={job} onValueChange={v => {
                            setGrid(prev => prev.map(r => r.id === row.id ? { ...r, h: r.h.map((hh, hi) => hi === i ? v : hh) } : r));
                          }}>
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {todayJobs.map(j => (
  <SelectItem key={j} value={j}>
    {j}
  </SelectItem>
))}
                            </SelectContent>
                          </Select>
                        </td>
                      ))}
                      {canEditDelete && (
                        <td>
                          <div className="flex items-center gap-1">
                            <Button

                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditClick(row)}
                              title="Edit assignment"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteTarget(row)}
                              title="Delete assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Assignment History</h3>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-4 border border-border p-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("mt-1 w-[140px] h-8 text-xs justify-start", !historyStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {historyStartDate ? format(historyStartDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={historyStartDate} onSelect={d => { setHistoryStartDate(d); setHistoryPage(1); }} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("mt-1 w-[140px] h-8 text-xs justify-start", !historyEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {historyEndDate ? format(historyEndDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={historyEndDate} onSelect={d => { setHistoryEndDate(d); setHistoryPage(1); }} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Employee</Label>
                <Input
                  placeholder="Filter by employee..."
                  className="mt-1 w-[160px] h-8 text-xs"
                  value={historyEmpFilter}
                  onChange={e => { setHistoryEmpFilter(e.target.value); setHistoryPage(1); }}
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearHistoryFilters}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    {Array.from({ length: 8 }, (_, i) => <th key={i}>H{i + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr><td colSpan={10} className="text-center text-sm text-muted-foreground py-8">No work assignments recorded.</td></tr>
                  ) : paginatedHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium whitespace-nowrap">{row.emp}</td>
                      <td className="whitespace-nowrap">{row.date}</td>
                      {row.h.map((job, j) => (
                        <td key={j} className="text-xs whitespace-nowrap">{job}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredHistory.length > ROWS_PER_PAGE && (
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Showing {((historyPage - 1) * ROWS_PER_PAGE) + 1}–{Math.min(historyPage * ROWS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="px-2">Page {historyPage} of {totalHistoryPages}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={historyPage >= totalHistoryPages} onClick={() => setHistoryPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={open => !open && setDeleteTarget(null)}
          title="Delete Assignment"
          description={`Are you sure you want to delete the work assignment for ${deleteTarget?.emp}? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          confirmLabel="Delete"
        />
      </div>
    </AppLayout>
  );
};

export default WorkAssignment;
