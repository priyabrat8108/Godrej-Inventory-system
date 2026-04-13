import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Package, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ✅ ADD THESE IMPORTS */
import {
  useNotifications,
  Notification,
} from "@/context/NotificationContext";

type Tab =
  | "inventory"
  | "usage"
  | "attendance"
  | "assignments"
  | "notifications";

const emptyMessage = (label: string) => (
  <tr>
    <td
      colSpan={10}
      className="text-center text-sm text-muted-foreground py-8"
    >
      No {label} available.
    </td>
  </tr>
);

const ManagerPanel = () => {
  const [tab, setTab] = useState<Tab>("notifications");

  /* ✅ CONTEXT INTEGRATION */
  const { notifications, markAsRead, unreadCount } = useNotifications();

  const [selectedNotif, setSelectedNotif] =
    useState<Notification | null>(null);

  const handleNotifClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setSelectedNotif(n);
  };

  const tabs: { key: Tab; label: string }[] = [
    {
      key: "notifications",
      label: `Notifications${
        unreadCount > 0 ? ` (${unreadCount})` : ""
      }`,
    },
    { key: "inventory", label: "Inventory History" },
    { key: "usage", label: "Usage Logs" },
    { key: "attendance", label: "Attendance" },
    { key: "assignments", label: "Work Assignments" },
  ];

  return (
    <AppLayout>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="page-title">Manager Panel</h1>
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export to Excel
          </Button>
        </div>

        {/* TABS */}
        <div className="flex gap-0 border-b border-border mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Notification Center</h3>

            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications.
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left p-3 border text-sm flex items-start gap-3 ${
                      n.read
                        ? "border-border bg-card"
                        : "border-l-2 border-l-primary border-border bg-primary/5"
                    }`}
                  >
                    {n.type === "usage" ? (
                      <Package className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs">
                        {n.type === "usage"
                          ? `Usage Request – ${n.data.itemCode} by ${n.data.operatorName}`
                          : `Leave Application – ${n.data.employeeName}`}
                      </p>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {n.timestamp}
                      </p>
                    </div>

                    {!n.read && (
                      <span className="h-2 w-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVENTORY */}
        {tab === "inventory" && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">
                Complete Inventory History
              </h3>
              <Input type="date" className="w-40 h-8 text-xs" />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Action</th>
                  <th>Qty Change</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>{emptyMessage("inventory records")}</tbody>
            </table>
          </div>
        )}

        {/* USAGE */}
        {tab === "usage" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Material Usage Logs</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Item Code</th>
                  <th>Date</th>
                  <th>Purpose</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>{emptyMessage("usage logs")}</tbody>
            </table>
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === "attendance" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Attendance Records</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status Today</th>
                  <th>Leave Balance</th>
                </tr>
              </thead>
              <tbody>{emptyMessage("attendance records")}</tbody>
            </table>
          </div>
        )}

        {/* ASSIGNMENTS */}
        {tab === "assignments" && (
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Work Assignment Records</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Job</th>
                  <th>Hours</th>
                  <th>Machine</th>
                </tr>
              </thead>
              <tbody>{emptyMessage("work assignment records")}</tbody>
            </table>
          </div>
        )}

        {/* NOTIFICATION DETAILS DIALOG */}
        <Dialog
          open={!!selectedNotif}
          onOpenChange={() => setSelectedNotif(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">
                {selectedNotif?.type === "usage"
                  ? "Usage Request Details"
                  : "Leave Application Details"}
              </DialogTitle>
            </DialogHeader>

            {selectedNotif && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 border border-border p-4">
                  {selectedNotif.type === "usage" ? (
                    <>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Operator Name
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.operatorName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Item Code
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.itemCode}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground text-xs">
                          Purpose
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.purpose}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Employee Name
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.employeeName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Start Date
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.leaveStart}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          End Date
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.leaveEnd}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground text-xs">
                          Reason
                        </span>
                        <p className="font-medium">
                          {selectedNotif.data.reason}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">
                      Date & Time
                    </span>
                    <p className="font-medium">
                      {selectedNotif.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ManagerPanel;