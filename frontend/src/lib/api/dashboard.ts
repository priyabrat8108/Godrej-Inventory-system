import axiosInstance from "../axios";

/* ===============================
   TYPES
================================= */

export interface InventorySummary {
  total_items: number;
  low_stock: number;
}

export interface LeaveSummary {
  pending_leaves: number;
}

export interface AssignmentSummary {
  total_assignments: number;
}

/* ===============================
   API CALLS
================================= */

export const fetchInventorySummary = async () => {
  const res = await axiosInstance.get(
    "reporting/high-authority/inventory-summary/"
  );
  return res.data;
};

export const fetchLeaveSummary = async () => {
  const res = await axiosInstance.get(
    "attendance/leaves/pending/count/"
  );
  return res.data;
};

export const fetchAssignmentSummary = async () => {
  const res = await axiosInstance.get(
    "assignments/today/count/"
  );
  return res.data;
};