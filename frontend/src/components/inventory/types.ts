export interface InventoryItem {
  id?: string;

  code: string;
  desc: string;
  machine: string;

  // Location
  location: string;
  cupboard: string;
  rack?: string;

  // Quantity
  qty: number;
  minQty: number;

  // Vendor
  vendor: string;
  vendorContact?: string;
  vendorEmail?: string;
  vendorAddress?: string;

  // Maintenance
  maintenanceCategory?: string;
  materialType?: string;

  // Metadata
  dateAdded?: string;
}

export interface UsageLog {
  id: string;
  itemCode: string;
  operatorName: string;
  qtyUsed: number;
  purpose: string;
  date: string;
  time: string;
}

export const MAINTENANCE_CATEGORIES = ["Spare Parts", "Consumables"] as const;

export const getStockStatus = (qty: number, minQty: number) => qty > minQty ? "In Stock" : "Low Stock";
export const getStockPercent = (qty: number, minQty: number) => Math.min(100, Math.round((qty / (minQty * 3)) * 100));

export interface TransactionLog {
  id: string;

  type: "PURCHASE" | "USAGE";

  operatorName: string;
  itemCode: string;

  qty?: number;

  previous?: number | string;
  added?: number | string;
  total?: number | string;

  purpose?: string;

  date?: string;
  time?: string;
}