import axiosInstance from "../axios";

export const fetchInventoryHistory = (params?: any) =>
  axiosInstance.get("reporting/high-authority/inventory-records/", {
    params,
  });