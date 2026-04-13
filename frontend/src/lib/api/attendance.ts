import axiosInstance from "../axios";

// ===============================
// Employee Registration
// ===============================
export const createEmployee = (data: any) => {
  return axiosInstance.post("attendance/employees/create/", data);
};

export const fetchEmployees = () => {
  return axiosInstance.get("attendance/employees/");
};

// ===============================
// Leave Application
// ===============================
export const applyLeave = (data: any) => {
  return axiosInstance.post("attendance/leaves/apply/", data);
};

// ===============================
// Leave History
// ===============================
export const fetchAttendanceRecords = (params?: any) => {
  return axiosInstance.get("attendance/leaves/", { params });
};

// ===============================
// Pending Leaves (Approval Panel)
// ===============================
export const fetchPendingLeaves = () => {
  return axiosInstance.get("attendance/leaves/pending/");
};

// ===============================
// Approve Leave
// ===============================
export const approveLeave = (id: string) => {
  return axiosInstance.post(`attendance/leaves/${id}/approve/`);
};

// ===============================
// Reject Leave
// ===============================
export const rejectLeave = (id: string) => {
  return axiosInstance.post(`attendance/leaves/${id}/reject/`);
};

export const fetchLeaveHistory = () => {
  return axiosInstance.get("leaves/");
};