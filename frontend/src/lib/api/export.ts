import axios from "@/lib/axios";

export const downloadInventoryExcel = async (params?: any) => {
  const response = await axios.get("/inventory/download_excel/", {
    params,
    responseType: "blob",
  });

  return response;
};