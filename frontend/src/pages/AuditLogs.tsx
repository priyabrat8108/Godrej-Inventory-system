import { AppLayout } from "@/components/AppLayout";
import { useAudit } from "@/context/AuditContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const AuditLogs = () => {
  const { auditLog } = useAudit();   // ✅ get logs from context
  const [search, setSearch] = useState("");

  const filtered = auditLog.filter(
    (e) =>
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div>
        <h1 className="page-title mb-4">Audit Logs</h1>
        <div className="bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">System Activity Log</h3>
            <Input
              placeholder="Search logs..."
              className="w-48 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No audit records available.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-medium">{entry.user}</td>
                    <td>{entry.action}</td>
                    <td>{entry.module}</td>
                    <td>{entry.oldValue || "—"}</td>
                    <td>{entry.newValue || "—"}</td>
                    <td>{entry.date}</td>
                    <td>{entry.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLogs;
