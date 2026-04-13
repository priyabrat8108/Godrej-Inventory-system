import axiosInstance from "../axios";

export const fetchUsers = () => {
  return axiosInstance.get("users/");
};

export const fetchPendingUsers = () => {
  return axiosInstance.get("users/pending/");
};

export const approveUser = (id: string) => {
  return axiosInstance.post(`users/${id}/approve/`);
};

export const rejectUser = (id: string) => {
  return axiosInstance.post(`users/${id}/reject/`);
};