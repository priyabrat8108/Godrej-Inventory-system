import axiosInstance from "../axios";
import axios from "@/lib/axios";


// ===============================
// JOB TITLES
// ===============================

export const fetchTodayJobTitles = () =>
  axiosInstance.get("work/job-titles/today/");

export const createJobTitle = (data: { title: string }) =>
  axiosInstance.post("work/job-titles/", data);

export const deleteJobTitle = (job_id: string) =>
  axiosInstance.delete(`work/job-titles/${job_id}/delete/`);


// ===============================
// TODAY ASSIGNMENTS
// ===============================

export const fetchTodayAssignments = () =>
  axiosInstance.get("work/today/");

export const createAssignment = (data: {
  employee_name: string;
  hours: string[];
}) =>
  axiosInstance.post("work/assign/", data);

export const updateAssignment = (
  assignment_id: string,
  data: { hours: string[] }
) =>
  axiosInstance.put(`work/assign/${assignment_id}/`, data);

export const deleteAssignment = (assignment_id: string) =>
  axiosInstance.delete(`work/assign/${assignment_id}/delete/`);


// ===============================
// HISTORY
// ===============================

export const fetchHistory = () =>
  axiosInstance.get("work/history/");


// ===============================
// LOCK DAY
// ===============================

export const lockWorkDay = () =>
  axiosInstance.post("work/lock-day/");

export const fetchLockStatus = () =>
  axiosInstance.get("work/lock-status/");

export const fetchWorkHistory = async (page: number = 1) => {
  const res = await axios.get<PaginatedResponse<WorkAssignment>>(
    `/work/history/?page=${page}`
  );
  return res.data;
};

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WorkAssignment {
  id: string;
  employee_name: string;
  date: string;
  hours: string[];
}


