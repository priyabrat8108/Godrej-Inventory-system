import React, { createContext, useContext, useState, ReactNode } from "react";

/* =========================
   Audit Entry Interface
========================= */

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  module: string;
  oldValue: string;
  newValue: string;
  date: string;
  time: string;
}

/* =========================
   Input Type (Clean Version)
========================= */

type AuditInput = {
  user: string;
  action: string;
  module: string;
  oldValue?: string;
  newValue?: string;
};

interface AuditContextType {
  auditLog: AuditEntry[];
  addAuditEntry: (entry: AuditInput) => void;
}

/* =========================
   Context
========================= */

const AuditContext = createContext<AuditContextType | null>(null);

/* =========================
   Provider
========================= */

export function AuditProvider({ children }: { children: ReactNode }) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
  const saved = localStorage.getItem("auditLogs");
  return saved ? JSON.parse(saved) : [];
});

  const addAuditEntry = (entry: AuditInput) => {
  const now = new Date();

  const newEntry: AuditEntry = {
    id: Date.now().toString(),
    user: entry.user,
    action: entry.action,
    module: entry.module,
    oldValue: entry.oldValue ?? "",
    newValue: entry.newValue ?? "",
    date: now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  setAuditLog((prev) => {
  const updated = [newEntry, ...prev];
  localStorage.setItem("auditLogs", JSON.stringify(updated));
  return updated;
});
};

  return (
    <AuditContext.Provider value={{ auditLog, addAuditEntry }}>
      {children}
    </AuditContext.Provider>
  );
}

/* =========================
   Hook
========================= */

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) {
    throw new Error("useAudit must be used within AuditProvider");
  }
  return ctx;
}

