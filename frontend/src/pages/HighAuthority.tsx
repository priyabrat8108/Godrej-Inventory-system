import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { AppLayout } from "@/components/AppLayout";
import { useNotifications, Notification } from "@/context/NotificationContext";
import { useAudit } from "@/context/AuditContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Package, Calendar, ClipboardList, CheckCircle, FileText, Users, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Tab = "overview" | "user-management" | "notifications" | "inventory" | "usage" | "attendance" | "assignments" | "audit";

const notifIcon = (type: string) => {
  if (type === "usage") return <Package className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
  if (type === "leave") return <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
  if (type === "leave_action") return <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
  return null;
};



const emptyMessage = (label: string) => (
  <tr><td colSpan={10} className="text-center text-sm text-muted-foreground py-8">No {label} available.</td></tr>
);

const HighAuthority = () => {
  const [inventoryHistory, setInventoryHistory] = useState<any[]>([]);

// ✅ SINGLE CLEAN FUNCTION
const getMaterialName = (code: any) => {
  if (!code) return "-";

  const item = inventoryHistory.find(
    (i: any) => String(i.item_code) === String(code)
  );

  return item?.material_name || item?.description || code;
};

const notifTitle = (n: Notification) => {
  if (n.type === "usage")
    return `Usage Request – ${
     inventoryData.find(i => String(i.code) === String(n.data.itemCode))?.desc
  || n.data.materialName
  || n.data.itemCode
}`;

  if (n.type === "leave")
    return `Leave Application – ${n.data.employeeName || "-"}`;

  if (n.type === "leave_action")
    return `Leave ${n.data.action || ""} – ${n.data.employeeName || "-"}`;

  return "Notification";
};

  const [tab, setTab] = useState<Tab>("overview");
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const safeNotifications = notifications.filter(
  (n) => n.type !== "work_assignment"
);

  const { user } = useAuth()
const { auditLog, addAuditEntry } = useAudit();

const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
const [confirmAction, setConfirmAction] = useState<{
  id: string;
  email: string;
  action: "approve" | "reject";
} | null>(null);

const [inventoryData, setInventoryData] = useState<any[]>([]);
const [usageLogs, setUsageLogs] = useState<any[]>([]);
const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
const [assignments, setAssignments] = useState<any[]>([]);

const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const totalInventory = inventoryHistory.length;

const lowStockItems = inventoryHistory.filter(
  (item: any) => item.qty <= item.minQty
).length;

const pendingLeaves = attendanceRecords.filter(
  (a: any) => a.status === "PENDING"
).length;

const pendingApprovals = registeredUsers.filter(
  (u: any) => u.status === "PENDING"
).length;

  useEffect(() => {
    
  loadInventory();
  loadUsageLogs();
  loadAttendance();
  loadAssignments();
  loadPendingUsers();
}, []);

const loadInventory = async () => {
  try {
    const res = await axiosInstance.get("/inventory/items/");

    const items = (res.data.results || []).map((item: any) => ({
      id: item.id,
      date: new Date(item.created_at).toLocaleDateString(),
      item_code: item.item_code,
      material_name: item.machine_name,
      description: item.description,
      action: "STOCK",
      qty_change: item.quantity,
      performed_by: item.vendor_name || "-"
    }));

    setInventoryHistory(items);

  } catch (err) {
    console.error("Inventory load failed", err);
  }
};

const loadUsageLogs = async () => {
  try {
    const res = await axiosInstance.get("/inventory/usage-logs/");

    const logs = (res.data.results || res.data).map((log: any) => ({
      id: log.id,
      operator: log.operator_name,
      item_code: log.item_code,
      date: log.date,
      purpose: log.purpose,
      status: log.status || "USED"
    }));

    setUsageLogs(logs);

  } catch (err) {
    console.error("Usage log load failed", err);
  }
};


const loadAttendance = async () => {
  try {
    const res = await axiosInstance.get("/attendance/leaves/");
    console.log("LEAVE DATA:", res.data);
    console.log("FIRST LEAVE OBJECT:", (res.data.results || res.data)[0]);

    console.log("LEAVE RECORDS:", res.data);
console.log("FIRST LEAVE:", (res.data.results || res.data)[0]);

  const records = (res.data.results || res.data).map((leave: any) => ({
  id: leave.id,
  employee: leave.employee_name || leave.employee,
  start: leave.start_date,
  end: leave.end_date,
  status: leave.status,

  // store raw value
  applied: leave.created_at || leave.date || leave.applied_on || null
}));

    setAttendanceRecords(records);

  } catch (err) {
    console.error("Attendance load failed", err);
  }
};
  

const loadAssignments = async () => {
  try {
    const res = await axiosInstance.get("/work/history/");
    setAssignments(res.data.results || []);
  } catch (err) {
    console.error("Assignments load failed", err);
  }
};

const loadPendingUsers = async () => {
  try {
    const res = await axiosInstance.get("/auth/pending-users/");

    const users = res.data.map((u:any) => ({
  id: u.id,              // 🔴 IMPORTANT
  name: u.full_name,
  email: u.email,
  role: u.role,
  mobile: u.mobile_number,
  employeeId: u.employee_id,
  status: u.status
}))

    setRegisteredUsers(users);

  } catch (err) {
    console.error("Pending users load failed", err);
  }
};

  const handleNotifClick = (n: Notification) => {
  if (!n.read) markAsRead(n.id);

  // 🔥 FORCE PURPOSE EXTRACTION
  const msg = n.data?.message || "";

  const extractedPurpose =
  msg.match(/for (.+)$/)?.[1] ||
  n.data?.purpose ||
  "General";

  setSelectedNotif({
    ...n,
    data: {
      ...n.data,
      purpose: n.data?.purpose || extractedPurpose
    }
  });
};

  const handleUserAction = async () => {
    console.log("ACTION USER:", confirmAction);
  if (!confirmAction) return;

  try {
    await axiosInstance.post(
      `/auth/user-action/${confirmAction.id}/`,
      { action: confirmAction.action }
    );

    console.log(
  confirmAction.action === "approve"
    ? "User approved successfully"
    : "User rejected successfully"
);

    addAuditEntry({
      user: user?.name || "Unknown",
      action:
        confirmAction.action === "approve"
          ? `Approved user ${confirmAction.email}`
          : `Rejected user ${confirmAction.email}`,
      module: "User Management",
    });

    loadPendingUsers(); // refresh table
  } catch (err) {
    console.error("User action failed", err);
  }

  setConfirmAction(null);
};

  const pendingUsers = registeredUsers.filter((u:any) => u.status === "PENDING");

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "user-management", label: `User Management${pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ""}` },
    { key: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "inventory", label: "Inventory Records" },
    { key: "usage", label: "Usage Logs" },
    { key: "attendance", label: "Attendance Records" },
    { key: "assignments", label: "Work Assignments" },
    { key: "audit", label: "Audit Logs" },
  ];

  return (
    <AppLayout>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div />
          <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Export to Excel
          </Button>
        </div>

        <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview / Summary Cards */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Inventory</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalInventory}</p>
              </div>
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Low Stock Items</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
              </div>
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Pending Leaves</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{pendingLeaves}</p>
              </div>
              <div className="bg-card border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Pending Approvals</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{pendingApprovals}</p>
              </div>
            </div>
            <div className="bg-card border border-border p-5">
              <h3 className="section-title">Recent Audit Activity</h3>
              <table className="data-table">
                <thead><tr><th>User</th><th>Action</th><th>Module</th><th>Date</th><th>Time</th></tr></thead>
                <tbody>
                  {auditLog.length === 0 ? emptyMessage("recent audit records") : auditLog.slice(0, 5).map((entry) => (
                    <tr key={entry.id}>
                      <td className="font-medium">{entry.user}</td>
                      <td>{entry.action}</td>
                      <td>{entry.module}</td>
                      <td>{entry.date}</td>
                      <td>{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management */}
        {tab === "user-management" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">User Management</h3>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Mobile</th><th>Employee ID</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {registeredUsers.length === 0 ? emptyMessage("registered users") : registeredUsers.map((u) => (
                  <tr key={u.email}>
                    <td className="font-medium">{u.name}</td>
<td>{u.email}</td>
<td>{u.role}</td>
<td>{u.mobile || "—"}</td>
<td>{u.employeeId || "—"}</td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 ${
                        u.status === "APPROVED" ? "bg-success/10 text-success" :
                        u.status === "REJECTED" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>{u.status}</span>
                    </td>
                    <td>
                      {u.status === "PENDING" ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-xs px-2" onClick={() =>
  setConfirmAction({
    id: u.id,
    email: u.email,
    action: "approve"
  })
}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() =>
  setConfirmAction({
    id: u.id,
    email: u.email,
    action: "reject"
  })
}>Reject</Button>
                        </div>
                      ) : u.role === "High Authority" ? (
                        <span className="text-xs text-muted-foreground">System Owner</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "notifications" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Notification Center</h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications.</p>
            ) : (
              <div className="space-y-2">
                {notifications
  .filter((n: any) => n.type !== "work_assignment")
  .map((n) => (
                  <button key={n.id} onClick={() => handleNotifClick(n)}
                    className={`w-full text-left p-3 border text-sm flex items-start gap-3 ${n.read ? "border-border bg-card" : "border-l-2 border-l-primary border-border bg-primary/5"}`}>
                    {notifIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs">{notifTitle(n)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.timestamp}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 bg-primary rounded-full mt-1 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "inventory" && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">Complete Inventory History</h3>
              <Input type="date" className="w-40 h-8 text-xs" />
            </div>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Item Code</th><th>Description</th><th>Action</th><th>Qty Change</th><th>By</th></tr></thead>
              <tbody>
{inventoryHistory.length === 0 ? (
  emptyMessage("inventory records")
) : (
  inventoryHistory.map((item:any) => (
    <tr key={item.id}>
      <td>{item.date}</td>
      <td>{item.item_code}</td>
      <td>{item.description}</td>
      <td>{item.action}</td>
      <td>{item.qty_change}</td>
      <td>{item.performed_by}</td>
    </tr>
  ))
)}
</tbody>
            </table>
          </div>
        )}

        {tab === "usage" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Material Usage Logs</h3>
            <table className="data-table">
              <thead><tr><th>Operator</th><th>Item Code</th><th>Date</th><th>Purpose</th><th>Status</th></tr></thead>
              <tbody>
{usageLogs.length === 0 ? (
  emptyMessage("usage logs")
) : (
  usageLogs.map((log:any) => (
    <tr key={log.id}>
      <td>{log.operator}</td>
      <td>{log.item_code}</td>
      <td>{log.date}</td>
      <td>{log.purpose}</td>
      <td>{log.status}</td>
    </tr>
  ))
)}
</tbody>
            </table>
          </div>
        )}

        {tab === "attendance" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Attendance Records</h3>
            <table className="data-table">
              <thead><tr><th>Employee Name</th>
<th>Leave Duration</th>
<th>Status</th>
<th>Applied Date</th></tr></thead>
              <tbody>
{attendanceRecords.length === 0 ? (
  emptyMessage("attendance records")
) : (
  attendanceRecords.map((leave:any) => (
<tr key={leave.id}>

<td>{leave.employee}</td>

<td>
{leave.start} – {leave.end}
</td>

<td>
<span className={`text-xs px-2 py-0.5 font-medium ${
leave.status === "Approved"
? "bg-success/10 text-success"
: leave.status === "Rejected"
? "bg-destructive/10 text-destructive"
: "bg-warning/10 text-warning"
}`}>
{leave.status}
</span>
</td>

<td>
  {leave.applied ? new Date(leave.applied).toLocaleDateString("en-GB") : "-"}
</td>

</tr>
))
)}
</tbody>
            </table>
          </div>
        )}

        {tab === "assignments" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Work Assignment Records</h3>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Employee</th><th>Job</th><th>Hours</th><th>Machine</th></tr></thead>
              <tbody>
{assignments.length === 0 ? (
  emptyMessage("work assignment records")
) : (
  assignments.map((a:any) => (
    <tr key={a.id}>
      <td>{a.date}</td>
      <td>{a.employee}</td>
      <td>{Object.values(a.hours || {}).join(", ")}</td>
      <td>8</td>
      <td>-</td>
    </tr>
  ))
)}
</tbody>
            </table>
          </div>
        )}

        {tab === "audit" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">System Audit Log</h3>
            <table className="data-table">
              <thead><tr><th>User</th><th>Action</th><th>Module</th><th>Old Value</th><th>New Value</th><th>Date</th><th>Time</th></tr></thead>
              <tbody>
                {auditLog.length === 0 ? (
                  emptyMessage("audit records")
                ) : auditLog.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-medium">{entry.user}</td>
                    <td>{entry.action}</td>
                    <td>{entry.module}</td>
                    <td>{entry.oldValue || "—"}</td>
                    <td>{entry.newValue || "—"}</td>
                    <td>{entry.date}</td>
                    <td>{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notification Detail Dialog */}
        <Dialog open={!!selectedNotif} onOpenChange={() => setSelectedNotif(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-sm font-semibold">{selectedNotif ? notifTitle(selectedNotif) : ""}</DialogTitle></DialogHeader>
            {selectedNotif && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 border border-border p-4">
                  {selectedNotif.type === "usage" && (
                    <>
                      <div><span className="text-muted-foreground text-xs">Operator</span><p className="font-medium">{selectedNotif.data.operatorName}</p></div>
                      <div><span className="text-muted-foreground text-xs">Material</span><p className="font-medium">{getMaterialName(selectedNotif.data?.itemCode)}</p></div>
                      <div className="col-span-2"><span className="text-muted-foreground text-xs">Purpose</span><p className="font-medium">{selectedNotif.data.purpose}</p></div>
                    </>
                  )}
                  {selectedNotif.type === "leave" && (
                    <>
                      <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedNotif.data?.employeeName}</p></div>
                      <div><span className="text-muted-foreground text-xs">Start</span><p className="font-medium">{selectedNotif.data.leaveStart}</p></div>
                      <div><span className="text-muted-foreground text-xs">End</span><p className="font-medium">{selectedNotif.data.leaveEnd}</p></div>
                      <div className="col-span-2"><span className="text-muted-foreground text-xs">Reason</span><p className="font-medium">{selectedNotif.data.reason}</p></div>
                    </>
                  )}
                  {selectedNotif.type === "leave_action" && (
                    <>
                      <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedNotif.data?.employeeName}</p></div>
                      <div><span className="text-muted-foreground text-xs">Action</span><p className="font-medium">{selectedNotif.data.action}</p></div>
                    
                      <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedNotif.data?.employeeName}</p></div>
                      <div><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{selectedNotif.data.date}</p></div>
                      <div className="col-span-2"><span className="text-muted-foreground text-xs">Jobs</span><p className="font-medium">{selectedNotif.data.assignedJobs}</p></div>
                    </>
                  )}
                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Timestamp</span><p className="font-medium">{selectedNotif.timestamp}</p></div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Approval Confirmation */}
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={() => setConfirmAction(null)}
          title={confirmAction?.action === "approve" ? "Approve User" : "Reject User"}
          description={confirmAction ? `Are you sure you want to ${confirmAction.action} the registration for ${confirmAction.email}?` : ""}
          confirmLabel={confirmAction?.action === "approve" ? "Approve" : "Reject"}
          onConfirm={handleUserAction}
        />
      </div>
    </AppLayout>
  );
};

export default HighAuthority;

