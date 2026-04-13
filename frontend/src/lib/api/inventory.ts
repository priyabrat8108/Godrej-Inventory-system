
import axiosInstance from "../axios";

export const fetchInventory = (params?: any) => {
  return axiosInstance.get(
    "reporting/high-authority/inventory-records/",
    { params }
  );
};

export const exportInventoryExcel = (params?: any) => {
  return axiosInstance.get(
    "reporting/high-authority/inventory-records/?export=true",
    {
      params,
      responseType: "blob",
    }
  );
};

export const createInventoryItem = (data: any) => {
  return axiosInstance.post("inventory/items/", data);
}

export const createInventoryTransaction = (data: any) => {
  return axiosInstance.post("inventory/transactions/", data);
};

export const updateInventoryItem = (id: string, data: any) => {
  return axiosInstance.patch(`inventory/items/${id}/`, data);
};

export const fetchUsageLogs = (params?: any) => {
  return axiosInstance.get(
    "reporting/high-authority/usage-logs/",
    { params }
  );
};
