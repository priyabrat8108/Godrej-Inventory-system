import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Package, Calendar, ClipboardList, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, Notification } from "@/context/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";

const routeTitles: Record<string, string> = {
  "/inventory": "Inventory Module",
  "/attendance": "Attendance Module",
  "/work-assignment": "Work Assignment Module",
  "/manager-panel": "Manager Panel",
  "/high-authority": "High Authority Overview",
  "/profile-settings": "Profile Settings",
  "/audit-logs": "Audit Logs",
};

const notifIcon = (type: string) => {
  if (type === "usage") return <Package className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
  if (type === "leave") return <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
  if (type === "leave_action") return <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
  return <ClipboardList className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />;
};

const notifTitle = (n: Notification) => {
  if (n.type === "usage") return `Usage Request – ${n.data.materialName || n.data.itemCode || "-"}`;
  if (n.type === "leave") return `Leave Application – ${n.data.employeeName}`;
  if (n.type === "leave_action") return `Leave ${n.data.action} – ${n.data.employeeName}`;
  return `Work Assignment – ${n.data.employeeName}`;
};

export function AppHeader({ lowStockCount = 0 }: { lowStockCount?: number }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const canSeeNotifs = user?.role === "Manager" || user?.role === "Admin" || user?.role === "High Authority";
  const pageTitle = routeTitles[location.pathname] || "Godrej Aerospace";

  const handleNotifClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setSelectedNotif(n);
  };

  return (
    <>
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-foreground">{pageTitle}</h2>
        <div className="flex items-center gap-4">
          {lowStockCount > 0 && (
            <button
              onClick={() => navigate("/inventory")}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium">{lowStockCount} Low Stock</span>
            </button>
          )}
          {canSeeNotifs && (
            <button className="relative text-muted-foreground hover:text-foreground" onClick={() => setShowNotifs(true)}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-medium">{unreadCount}</span>
              )}
            </button>
          )}
          <div className="text-right text-xs">
            <div className="font-medium text-foreground">{user?.name}</div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{user?.role}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Notifications Dialog */}
      <Dialog open={showNotifs} onOpenChange={setShowNotifs}>
        <DialogContent className="max-w-md">
  <DialogHeader className="space-y-2">

  <div className="flex justify-between items-center">

    <DialogTitle className="text-sm font-semibold">
      Notifications
    </DialogTitle>

    <Button
      size="sm"
      variant="outline"
      onClick={markAllAsRead}
      disabled={!notifications.some(n => !n.read)}
      className="h-7 text-xs px-3"
    >
      Mark all as read
    </Button>

  </div>

  <DialogDescription className="text-xs text-muted-foreground">
    System notifications and alerts.
  </DialogDescription>

</DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button key={n.id} onClick={() => handleNotifClick(n)}
                  className={`w-full text-left p-3 border text-sm flex items-start gap-3 ${n.read ? "border-border bg-card" : "border-l-2 border-l-primary border-border bg-primary/5"}`}>
                  {notifIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{notifTitle(n)}</p>

<p className="text-xs text-muted-foreground">
  {n.data?.purpose || ""}
</p>

<p className="text-xs text-muted-foreground mt-0.5">
  {n.timestamp || "-"}
</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 bg-primary rounded-full mt-1 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotif} onOpenChange={() => setSelectedNotif(null)}>
        <DialogContent className="max-w-sm">
  <DialogHeader>
    <DialogTitle className="text-sm font-semibold">
      {selectedNotif ? notifTitle(selectedNotif) : ""}
    </DialogTitle>
    <DialogDescription className="text-xs text-muted-foreground">
      Notification details
    </DialogDescription>
  </DialogHeader>
          {selectedNotif && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 border border-border p-4">
                {selectedNotif.type === "usage" && (
                  <>
                    <div><span className="text-muted-foreground text-xs">Operator</span><p className="font-medium">{selectedNotif.data.operatorName}</p></div>
                    <div><span className="text-muted-foreground text-xs">Item Code</span><p className="font-medium">
  {selectedNotif.data.materialName || selectedNotif.data.itemCode || "-"}
</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground text-xs">Purpose</span><p className="font-medium">{selectedNotif.data.purpose}</p></div>
                  </>
                )}
                {selectedNotif.type === "leave" && (
                  <>
                    <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedNotif.data.employeeName}</p></div>
                    <div><span className="text-muted-foreground text-xs">Start</span><p className="font-medium">{selectedNotif.data.leaveStart}</p></div>
                    <div><span className="text-muted-foreground text-xs">End</span><p className="font-medium">{selectedNotif.data.leaveEnd}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground text-xs">Reason</span><p className="font-medium">{selectedNotif.data.reason}</p></div>
                  </>
                )}
                {selectedNotif.type === "leave_action" && (
                  <>
                    <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedNotif.data.employeeName}</p></div>
                    <div><span className="text-muted-foreground text-xs">Action</span><p className="font-medium">{selectedNotif.data.action}</p></div>
                    <div><span className="text-muted-foreground text-xs">Period</span><p className="font-medium">{selectedNotif.data.leaveStart} – {selectedNotif.data.leaveEnd}</p></div>
                  </>
                )}
                {selectedNotif.type === "work_assignment" && (
                  <>
                    <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedNotif.data.employeeName}</p></div>
                    <div><span className="text-muted-foreground text-xs">Date</span><p className="font-medium">{selectedNotif.data.date}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground text-xs">Jobs</span><p className="font-medium">{selectedNotif.data.assignedJobs}</p></div>
                  </>
                )}
                <div className="col-span-2">
  <span className="text-muted-foreground text-xs">Timestamp</span>
  <p className="font-medium">
    {selectedNotif.timestamp || "-"}
  </p>
</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
