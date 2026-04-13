import axiosInstance from "@/lib/axios";
import { useEffect } from "react";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useAudit } from "@/context/AuditContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Tab = "register" | "leave" | "history" | "approval";

const Attendance = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { addAuditEntry } = useAudit();
  const [tab, setTab] = useState<Tab>("history");
  const [leaveEmployee, setLeaveEmployee] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);


  const fetchLeaves = async () => {
  try {

    const res = await axiosInstance.get("attendance/leaves/");

    console.log("LEAVES API RESPONSE:", res.data);

    const leaves = res.data.results || res.data || [];

    const mapped = leaves.map((l: any) => ({
  id: l.id,
      name: l.employee_name,
      duration: l.leave_duration,
      start: l.start_date || "",
      end: l.end_date || "",
      reason: l.reason || "",
      status:
        l.status === "PENDING"
          ? "Pending"
          : l.status === "APPROVED"
          ? "Approved"
          : "Rejected",
      applied: new Date(l.applied_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    }));

    setLeaveHistory(mapped);

  } catch (err) {
    console.error("Failed loading leaves:", err);
  }
};

useEffect(() => {
  fetchLeaves();
}, []);



  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{ index: number; action: "Approved" | "Rejected" } | null>(null);

  const canApprove = user?.role === "Admin" || user?.role === "High Authority";

  const handleLeaveSubmit = () => {
    console.log("SENDING NOTIFICATION:", {
  type: "leave",
  employeeName: leaveEmployee
});

  if (!leaveEmployee || !leaveStart || !leaveEnd || !leaveReason.trim()) return;
  if (new Date(leaveEnd) < new Date(leaveStart)) return;

  axiosInstance.post("attendance/leaves/apply/", {
      employee_name: leaveEmployee.trim().toLowerCase(),
      start_date: leaveStart,
      end_date: leaveEnd,
      reason: leaveReason.trim()
    }
  )
  .then((res) => {
    console.log("Leave saved to database:", res.data);

    fetchLeaves();   // reload database data
  })
  .catch((err) => {
  console.log("FULL ERROR:", err);
  console.log("RESPONSE DATA:", err.response?.data);
  console.log("STATUS:", err.response?.status);
  alert(JSON.stringify(err.response?.data));
});
  addNotification({
      type: "leave",
      message: `Leave request from ${leaveEmployee}`,
      data: {
        employeeName: leaveEmployee,
        leaveStart,
        leaveEnd,
        reason: leaveReason.trim()
      }
    });
    addAuditEntry({ user: user?.name || "Unknown", action: `Leave applied for ${leaveEmployee}`, module: "Attendance" });
    setLeaveHistory(prev => [{
      name: leaveEmployee,
      duration: `${leaveStart} – ${leaveEnd}`,
      start: leaveStart,
      end: leaveEnd,
      reason: leaveReason.trim(),
      status: "Pending",
      applied: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    }, ...prev]);
    setLeaveEmployee("");
    setLeaveStart("");
    setLeaveEnd("");
    setLeaveReason("");
  };

  const handleLeaveAction = async (
    
  index: number,
  action: "Approved" | "Rejected"
) => {
  const leave = leaveHistory[index];
  console.log("Leave ID:", leave.id);


  try {

    if (action === "Approved") {

      await axiosInstance.post(
        `attendance/leaves/${leave.id}/approve/`
      );

    } else {

      await axiosInstance.post(
        `attendance/leaves/${leave.id}/reject/`,
        {
          rejection_reason: "Rejected by authority"
        }
      );

    }

    console.log(`Leave ${action} successfully`);

    fetchLeaves();

  } catch (err) {
    console.error("Leave action failed", err);
  }
};

  const tabs: { key: Tab; label: string; roles: string[] }[] = [
    { key: "register", label: "Employee Registration", roles: ["Admin", "Manager", "High Authority"] },
    { key: "leave", label: "Leave Application", roles: ["Admin", "Manager", "High Authority", "Operator"] },
    { key: "history", label: "Leave History", roles: ["Admin", "Manager", "High Authority", "Operator"] },
    { key: "approval", label: "Leave Approval", roles: ["Admin", "High Authority"] },
  ];

  return (
    <AppLayout>
      <div>
        <div className="flex gap-0 border-b border-border mb-6">
          {tabs.filter(t => user && t.roles.includes(user.role)).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "register" && (
          <div className="bg-card border border-border p-5 max-w-lg">
            <h3 className="section-title">Register New Employee</h3>
            <div className="space-y-3">
              <div><Label className="text-xs">Full Name</Label><Input
  className="mt-1"
  placeholder="Employee name"
  value={employeeName}
  onChange={(e) => setEmployeeName(e.target.value)}
/></div>
              <div><Label className="text-xs">Role</Label><Input
  className="mt-1"
  placeholder="Enter role (e.g. Operator)"
  value={employeeRole}
  onChange={(e) => setEmployeeRole(e.target.value)}
/></div>
              <Button
  onClick={() => {
    axiosInstance.post("attendance/employees/create/", {
      full_name: employeeName.trim(),
      role: employeeRole.trim()
    })
    .then(() => {
      console.log("Employee registered");

      setEmployeeName("");
      setEmployeeRole("");
    })
    .catch((err) => {
      console.error("Employee creation failed:", err.response?.data);
    });
  }}
>
Register Employee
</Button>
            </div>
          </div>
        )}

        {tab === "leave" && (
          <div className="bg-card border border-border p-5 max-w-lg">
            <h3 className="section-title">Apply for Leave</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Employee Name</Label>
                <Input className="mt-1" placeholder="Enter employee name" value={leaveEmployee} onChange={(e) => setLeaveEmployee(e.target.value)} />
              </div>
              <div className="form-grid">
                <div><Label className="text-xs">Start Date</Label><Input className="mt-1" type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} /></div>
                <div><Label className="text-xs">End Date</Label><Input className="mt-1" type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} /></div>
              </div>
              <div><Label className="text-xs">Reason</Label><Input className="mt-1" placeholder="Leave reason" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} /></div>
              <Button onClick={handleLeaveSubmit} disabled={!leaveEmployee || !leaveStart || !leaveEnd || !leaveReason.trim()}>Submit Application</Button>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">Leave History</h3>
              <Input type="month" className="w-40 h-8 text-xs" />
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Employee Name</th><th>Leave Duration</th><th>Status</th><th>Applied Date</th></tr>
              </thead>
              <tbody>
                {leaveHistory.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-sm text-muted-foreground py-8">No leave records available.</td></tr>
                ) : leaveHistory.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.duration}</td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 ${
                        row.status === "Approved" ? "bg-success/10 text-success" :
                        row.status === "Rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>{row.status}</span>
                    </td>
                    <td>{row.applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "approval" && canApprove && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Leave Approval Panel</h3>
            <table className="data-table">
              <thead>
                <tr><th>Employee Name</th><th>Start Date</th><th>End Date</th><th>Reason</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {leaveHistory.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-sm text-muted-foreground py-8">No leave applications.</td></tr>
                ) : leaveHistory.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.start}</td>
                    <td>{row.end}</td>
                    <td>{row.reason}</td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 ${
                        row.status === "Approved" ? "bg-success/10 text-success" :
                        row.status === "Rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>{row.status}</span>
                    </td>
                    <td>
                      {row.status === "Pending" ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-xs px-2" onClick={() => setConfirmAction({ index: i, action: "Approved" })}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setConfirmAction({ index: i, action: "Rejected" })}>Reject</Button>
                        </div>
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

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={() => setConfirmAction(null)}
          title={confirmAction?.action === "Approved" ? "Approve Leave" : "Reject Leave"}
          description={confirmAction ? `Are you sure you want to ${confirmAction.action === "Approved" ? "approve" : "reject"} this leave application?` : ""}
          confirmLabel={confirmAction?.action === "Approved" ? "Approve" : "Reject"}
          onConfirm={() => {
            if (confirmAction) {
              handleLeaveAction(confirmAction.index, confirmAction.action);
              setConfirmAction(null);
            }
          }}
        />
      </div>
    </AppLayout>
  );
};

export default Attendance;
