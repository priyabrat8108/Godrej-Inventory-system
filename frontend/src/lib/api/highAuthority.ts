
import axiosInstance from "../axios";

export const fetchInventoryRecords = () => {
  return axiosInstance.get("reporting/high-authority/inventory-records/");
};

export const fetchUsageLogs = () => {
  return axiosInstance.get("reporting/high-authority/usage-logs/");
};

export const fetchAttendanceRecords = () => {
  return axiosInstance.get("reporting/high-authority/attendance-records/");
};

export const fetchWorkAssignments = () => {
  return axiosInstance.get("reporting/high-authority/work-assignments/");
};

export const fetchPendingUsers = () =>
  axiosInstance.get("users/pending/");

export const approveUserApi = (id: string) =>
  axiosInstance.post(`users/${id}/approve/`);

export const rejectUserApi = (id: string) =>
  axiosInstance.post(`users/${id}/reject/`)