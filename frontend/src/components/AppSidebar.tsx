import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  Package,
  Users,
  ClipboardList,
  Shield,
  Crown,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import godrejLogo from "@/assets/godrej-logo.png";

const navItems = [
  { title: "Inventory", path: "/inventory", icon: Package, roles: ["Operator", "Admin", "Manager", "High Authority"] },
  { title: "Attendance", path: "/attendance", icon: Users, roles: ["Admin", "Manager", "High Authority"] },
  { title: "Work Assignment", path: "/work-assignment", icon: ClipboardList, roles: ["Operator", "Admin", "Manager", "High Authority"] },
  { title: "Manager Panel", path: "/manager-panel", icon: Shield, roles: ["Manager"] },
  { title: "High Authority", path: "/high-authority", icon: Crown, roles: ["High Authority"] },
  { title: "Audit Logs", path: "/audit-logs", icon: FileText, roles: ["High Authority"] },
  { title: "Profile Settings", path: "/profile-settings", icon: User, roles: ["Admin", "High Authority"] },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-200`}>
      <div className="p-4 flex items-center justify-center border-b border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img src={godrejLogo} alt="Godrej" className="h-8 bg-white rounded-sm px-1" />
            <span className="text-sidebar-foreground text-xs font-semibold leading-tight">Aerospace</span>
          </div>
        ) : (
          <img src={godrejLogo} alt="Godrej" className="h-6 bg-white rounded-sm px-1" />
        )}
      </div>
      <nav className="flex-1 py-2">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-l-2 border-transparent"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </RouterNavLink>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 text-sidebar-foreground hover:bg-sidebar-accent/50 border-t border-sidebar-border flex justify-center"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
