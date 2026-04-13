import axios from "@/lib/axios";

/* ============================= */
/* 🔹 LOGIN */
/* ============================= */

export const loginUser = async (email: string, password: string) => {
  return axios.post("auth/login/", {
    email,
    password,
  });
};

/* ============================= */
/* 🔹 REGISTER */
/* ============================= */

export const registerUser = async (data: any) => {
  return axios.post("auth/register/", data);
};

/* ============================= */
/* 🔹 INITIALIZE SYSTEM */
/* ============================= */

export const initializeSystemApi = (data: {
  full_name: string;
  email: string;
  password: string;
}) => {
  return axios.post("auth/initialize/", data);
};

/* ============================= */
/* 🔹 CHECK INITIALIZATION */
/* ============================= */

export const checkInitializationStatus = async () => {
  return axios.get("auth/check-initialization-status/");
};

/* ============================= */
/* 🔹 PROFILE */
/* ============================= */

export const getProfile = async () => {
  return axios.get("auth/profile/");
};

/* ============================= */
/* 🔹 LOGOUT */
/* ============================= */

export const logoutAll = async () => {
  return axios.post("auth/logout/");
};