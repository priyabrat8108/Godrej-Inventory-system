import { AppLayout } from "@/components/AppLayout";
import { Package, AlertTriangle, ClipboardList, Users, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
  { label: "Total Inventory Items", value: "1,247", icon: Package },
  { label: "Low Stock Items", value: "18", icon: AlertTriangle },
  { label: "Today's Work Assignments", value: "34", icon: ClipboardList },
  { label: "Employees on Leave", value: "5", icon: Users },
  { label: "Pending Approvals", value: "12", icon: Clock },
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div>
        <h1 className="page-title mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Welcome back, {user?.name}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-primary" />
                <span className="stat-card-label">{stat.label}</span>
              </div>
              <span className="stat-card-value">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Recent Inventory Activity</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Action</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: "AE-1042", action: "Issued", by: "Amit Patel", date: "09 Feb 2026" },
                  { code: "AE-0987", action: "Restocked", by: "Rajesh Kumar", date: "09 Feb 2026" },
                  { code: "AE-1105", action: "Low Stock Alert", by: "System", date: "08 Feb 2026" },
                  { code: "AE-0765", action: "Issued", by: "Vikram Singh", date: "08 Feb 2026" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium">{row.code}</td>
                    <td>{row.action}</td>
                    <td>{row.by}</td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Today's Assignments */}
          <div className="bg-card border border-border p-5">
            <h3 className="section-title">Today's Assignments</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Job</th>
                  <th>Machine</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { emp: "Amit Patel", job: "CNC Machining - Turbine Blade", machine: "CNC-04", status: "In Progress" },
                  { emp: "Vikram Singh", job: "Quality Inspection", machine: "QC-01", status: "Pending" },
                  { emp: "Neha Gupta", job: "Assembly - Fuel System", machine: "ASM-02", status: "Completed" },
                  { emp: "Rohit Verma", job: "Welding - Exhaust Nozzle", machine: "WLD-03", status: "In Progress" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td>{row.emp}</td>
                    <td>{row.job}</td>
                    <td>{row.machine}</td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-0.5 ${
                        row.status === "Completed" ? "bg-success/10 text-success" :
                        row.status === "In Progress" ? "bg-primary/10 text-primary" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
