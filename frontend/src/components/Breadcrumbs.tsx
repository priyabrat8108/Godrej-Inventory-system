import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, { parent: string; child: string }> = {
  "/inventory": { parent: "Inventory", child: "Stock" },
  "/attendance": { parent: "Attendance", child: "Overview" },
  "/work-assignment": { parent: "Work Assignment", child: "Daily Grid" },
  "/manager-panel": { parent: "Manager Panel", child: "Overview" },
  "/high-authority": { parent: "High Authority", child: "Overview" },
  "/profile-settings": { parent: "Settings", child: "Profile" },
  "/audit-logs": { parent: "High Authority", child: "Audit Logs" },
};

export function Breadcrumbs() {
  const location = useLocation();
  const route = routeLabels[location.pathname];
  if (!route) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <span className="text-foreground font-medium">{route.parent}</span>
      <ChevronRight className="h-3 w-3" />
      <span>{route.child}</span>
    </nav>
  );
}
