import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useAudit } from "@/context/AuditContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, printPdfReport } from "@/lib/exportUtils";
import { InventoryItem, UsageLog, MAINTENANCE_CATEGORIES, getStockStatus, getStockPercent } from "@/components/inventory/types";
import { SearchableSelect } from "@/components/inventory/SearchableSelect";
import { InventoryActionMenu } from "@/components/inventory/InventoryActionMenu";
import { EditMaterialModal } from "@/components/inventory/EditMaterialModal";
import { UseMaterialModal } from "@/components/inventory/UseMaterialModal";
import { HistoryModal } from "@/components/inventory/HistoryModal";

type Tab = "stock" | "add" | "manager";

const Inventory = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { addAuditEntry } = useAudit();

  

  const [tab, setTab] = useState<Tab>("stock");
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

useEffect(() => {
  fetchInventory();
  fetchUsageLogs();
}, []);

const fetchUsageLogs = async () => {
  try {

    const res = await axios.get("/inventory/usage-logs/");

    const logs = res.data.results.map((log: any) => ({
      id: log.id,
      itemCode: log.item_code,
      operatorName: log.operator_name,
      qtyUsed: log.quantity_used,
      purpose: log.purpose,
      date: log.date,
      time: log.time,
    }));

    setUsageLogs(logs);

  } catch (error) {
    console.error("Failed to fetch usage logs:", error);
  }
};

const fetchTransactions = async (itemId: string, itemCode: string) => {
  
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(`/inventory/items/${itemId}/transactions/`);
    const tx = res.data?.results?.transactions || [];

    const mapped = tx.map((t: any) => {
      console.log("TRANSACTION:", t);

      let prev: number | string = "-";
      let added: number | string = "-";
      let total: number | string = "-";

      // ✅ STOCK ADD LOGIC
      if (t.purpose?.includes("Stock updated")) {
        const match = t.purpose.match(/(\d+) → (\d+)/);

        if (match) {
          prev = Number(match[1]);
          total = Number(match[2]);
          added = Number(total) - Number(prev);
        }
      }

      let operator = t.performed_by || "System";


      // USAGE → operator name
      if (t.type === "USAGE" && t.purpose?.includes("Operator:")) {
         operator = t.purpose.split("Operator:")[1].trim();
      }

      // PURCHASE → username instead of email
      // ✅ OPERATOR / USER LOGIC
    

// USAGE → operator name (manual input)


// ✅ USAGE → operator input (keep as is)
if (t.type === "USAGE" && t.purpose?.includes("Operator:")) {
  operator = t.purpose.split("Operator:")[1].trim();
} 
else {
  // ✅ EMAIL → FULL NAME FORMAT
  if (typeof operator === "string" && operator.includes("@")) {

    const username = operator.split("@")[0];

    // convert: shibapradhan8108 → Shibapradhan
    operator = username
      .replace(/[0-9]/g, "")                 // remove numbers
      .replace(/([a-z])([A-Z])/g, "$1 $2")   // split camelCase if any
      .replace(/^./, (c) => c.toUpperCase()); // capitalize
  }
}

      // ✅ FINAL RETURN (ONLY ONE RETURN)
      return {
        id: t.transaction_id,
        type: t.type,

        operatorName: operator,
        itemCode: itemCode,

        qty: t.quantity,

        previous: prev,
        added,
        total,

        purpose: t.purpose || "",

        date: t.created_at
          ? new Date(t.created_at).toLocaleDateString("en-GB")
          : "-",

        time: t.created_at
          ? new Date(t.created_at).toLocaleTimeString("en-GB")
          : "-",
      };
    });

    setTransactions(mapped);

  } catch (err) {
    console.error("Transaction fetch failed:", err);
    setTransactions([]);
  }
};


const fetchInventory = async () => {
  const res = await axios.get("/inventory/items/");
  const items = res.data.results.map((item: any) => ({
  id: item.id,
  code: item.item_code,
  desc: item.description,
  machine: item.machine_name,
  qty: item.quantity,
  minQty: item.min_quantity,

  vendor: item.vendor?.name || "",
  vendorContact: item.vendor?.contact_number || "",
  vendorEmail: item.vendor?.email || "",
  vendorAddress: item.vendor?.address || "",

  cupboard: item.cupboard_no,
  location: `${item.cupboard_no} / ${item.rack_no}`,
  maintenanceCategory: item.maintenance_category,
  materialType: item.material_type,
  dateAdded: item.created_at,
}));







  setInventoryData(items);
};

  
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);

  // Stock filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cupboardFilter, setCupboardFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [materialTypeFilter, setMaterialTypeFilter] = useState("all");

  // Report Center filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [newlyBought, setNewlyBought] = useState(false);
  const [rcCupboardFilter, setRcCupboardFilter] = useState("all");
  const [rcVendorFilter, setRcVendorFilter] = useState("all");
  const [rcMachineFilter, setRcMachineFilter] = useState("all");
  const [rcCategoryFilter, setRcCategoryFilter] = useState("all");
  const [rcMaterialTypeFilter, setRcMaterialTypeFilter] = useState("all");

  // Modals
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [useItem, setUseItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  // Add Material form
  const [addForm, setAddForm] = useState({
    code: "", desc: "", machine: "", cupboard: "", rack: "", qty: "", minQty: "",
    vendorName: "", vendorContact: "", vendorEmail: "", vendorAddress: "",
    maintenanceCategory: "" as string,
    materialType: "",
  });

  const isOperator = user?.role === "Operator";
  const canEdit = user?.role === "Admin" || user?.role === "High Authority" || user?.role === "Manager";
  const canExport = user?.role !== "Operator";

  const lowStockCount = inventoryData.filter(i => i.qty <= i.minQty).length;

  const cupboards = [...new Set(inventoryData.map(i => i.cupboard).filter(Boolean))] as string[];
  const vendors = [...new Set(inventoryData.map(i => i.vendor).filter(Boolean))] as string[];
  const machines = [...new Set(inventoryData.map(i => i.machine).filter(Boolean))];
  const materialTypes = [...new Set(inventoryData.map(i => i.materialType).filter(Boolean))] as string[];

  const filtered = inventoryData.filter((item) => {
    const matchesSearch =
  item.code.toLowerCase().includes(search.toLowerCase()) ||
  item.desc.toLowerCase().includes(search.toLowerCase()) ||
  item.machine.toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(item.qty, item.minQty);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesCupboard = cupboardFilter === "all" || item.cupboard === cupboardFilter;
    const matchesVendor = vendorFilter === "all" || item.vendor === vendorFilter;
    const matchesMachine = machineFilter === "all" || item.machine === machineFilter;
    const matchesCategory =
  categoryFilter === "all" ||
  (categoryFilter === "Spare Parts" && item.maintenanceCategory === "SPARE_PART") ||
  (categoryFilter === "Consumables" && item.maintenanceCategory === "CONSUMABLE");
    const matchesMaterialType = materialTypeFilter === "all" || item.materialType === materialTypeFilter;
    return matchesSearch && matchesStatus && matchesCupboard && matchesVendor && matchesMachine && matchesCategory && matchesMaterialType;
  });

  const handleUseMaterial = async (
  operatorName: string,
  purpose: string,
  qtyUsed: number
) => {

  if (!useItem) return;

  try {

    // 🔹 Send usage to backend
    await axios.post(`/inventory/items/${useItem.id}/use/`, {
      quantity_used: qtyUsed,
      purpose: purpose,
      operator_name: operatorName
    });

    // 🔹 Reload inventory from database
    await fetchInventory();
    await fetchUsageLogs();

    const now = new Date();

    const log: UsageLog = {
      id: Date.now().toString(),
      itemCode: useItem.code,
      operatorName,
      qtyUsed,
      purpose,
      date: now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // 🔹 Update UI usage logs
    setUsageLogs(prev => [log, ...prev]);
    console.log("MESSAGE SENT:", `${qtyUsed} units of ${useItem.desc} used by ${operatorName} for ${purpose}`);
    // 🔹 Notification
    addNotification({
  type: "usage",

  message: `${qtyUsed} units of ${useItem.desc} used by ${operatorName} for ${purpose}`,

  data: {
    operatorName,
    itemCode: useItem.code,

    // ✅ FIXED (NO ERRORS)
    materialName:
  (useItem as any).description ||
  (useItem as any).material_name ||
  (useItem as any).item_name ||
  useItem.code,

    purpose
  }
});

    // 🔹 Audit log
    addAuditEntry({
      user: operatorName,
      action: `Used ${qtyUsed} of ${useItem.code}`,
      module: "Inventory",
      oldValue: `Qty: ${useItem.qty}`,
      newValue: `Qty: ${useItem.qty - qtyUsed}`,
    });

  } catch (error: any) {

    console.error(
      "Material usage failed:",
      error.response?.data || error.message
    );

  } finally {

    // 🔹 Always close modal
    setUseItem(null);

  }

};

const categoryMap: Record<string, string> = {
  "Spare Parts": "SPARE_PART",
  "Consumables": "CONSUMABLE",
};

const handleEditSave = async (updated: InventoryItem, old: InventoryItem) => {

  try {

    await axios.put(`/inventory/items/${old.id}/update/`, {

      item_code: updated.code,
      description: updated.desc,
      machine_name: updated.machine,

      cupboard_no: updated.cupboard,
      rack_no: updated.location?.split("/")[1]?.trim(),

      quantity: updated.qty,
      min_quantity: updated.minQty,

      maintenance_category:
        updated.maintenanceCategory &&
        categoryMap[updated.maintenanceCategory]
          ? categoryMap[updated.maintenanceCategory]
          : "OTHER",

      material_type: updated.materialType || "GENERAL",

      vendor_name: updated.vendor,
      vendor_contact: updated.vendorContact,
      vendor_email: updated.vendorEmail,
      vendor_address: updated.vendorAddress

    });

    // reload data from backend
    await fetchInventory();

    // audit log
    addAuditEntry({
      user: user?.name || "Unknown",
      action: `Edited material ${updated.code}`,
      module: "Inventory",
      oldValue: `Qty: ${old.qty}`,
      newValue: `Qty: ${updated.qty}`,
    });

  } catch (error: any) {

    console.error(
      "Edit material failed:",
      error.response?.data || error.message
    );

  }

};

  const handleAddMaterial = async () => {
  if (!addForm.code.trim() || !addForm.desc.trim() || !addForm.machine.trim()) {
    console.log("Required fields missing");
    return;
  }

  const qty = parseInt(addForm.qty) || 0;
  const minQty = parseInt(addForm.minQty) || 0;

  const newItem: InventoryItem = {
    code: addForm.code.trim(),
    desc: addForm.desc.trim(),
    machine: addForm.machine.trim(),
    location: `${addForm.cupboard.trim()} / ${addForm.rack.trim()}`,
    qty,
    minQty,
    vendor: addForm.vendorName.trim(),
    vendorContact: addForm.vendorContact.trim(),
    vendorEmail: addForm.vendorEmail.trim(),
    vendorAddress: addForm.vendorAddress.trim(),
    cupboard: addForm.cupboard.trim(),
    dateAdded: new Date().toISOString().split("T")[0],
    maintenanceCategory: addForm.maintenanceCategory || undefined,
    materialType:
      addForm.maintenanceCategory === "Spare Parts"
        ? addForm.materialType.trim()
        : undefined,
  };

  try {

    await axios.post("/inventory/items/create/", {
      item_code: newItem.code,
      description: newItem.desc,
      machine_name: newItem.machine,
      cupboard_no: addForm.cupboard,
      rack_no: addForm.rack,
      quantity: qty,
      min_quantity: minQty,

      vendor_name: addForm.vendorName,
      vendor_contact: addForm.vendorContact,
      vendor_email: addForm.vendorEmail,
      vendor_address: addForm.vendorAddress,

      maintenance_category:
        categoryMap[addForm.maintenanceCategory] || "OTHER",

      material_type:
        addForm.maintenanceCategory === "Spare Parts"
          ? addForm.materialType || "GENERAL"
          : "GENERAL",
    });

    // Reload from backend
    await fetchInventory();

    addNotification({
      type: "inventory",
      message: `Material ${newItem.code} added to inventory`,
    });

    addAuditEntry({
      user: user?.name || "Unknown",
      action: `Added material ${newItem.code}`,
      module: "Inventory",
      oldValue: "",
      newValue: `Qty: ${qty}`,
    });

    // Reset form
    setAddForm({
      code: "",
      desc: "",
      machine: "",
      cupboard: "",
      rack: "",
      qty: "",
      minQty: "",
      vendorName: "",
      vendorContact: "",
      vendorEmail: "",
      vendorAddress: "",
      maintenanceCategory: "",
      materialType: "",
    });

  } catch (error: any) {

    console.error("BACKEND ERROR FULL:", error);

    if (error.response) {
      console.error("STATUS:", error.response.status);
      console.error("SERIALIZER ERROR:", error.response.data);
    } else if (error.request) {
      console.error("REQUEST SENT BUT NO RESPONSE:", error.request);
    } else {
      console.error("ERROR MESSAGE:", error.message);
    }

  }
};

const reportFilteredData = inventoryData.filter((item) => {

  const createdDate = item.dateAdded ? new Date(item.dateAdded) : null;

  const matchesDateFrom =
    !dateFrom || (createdDate && createdDate >= new Date(dateFrom));

  const matchesDateTo =
    !dateTo || (createdDate && createdDate <= new Date(dateTo));

  const matchesMonth =
    !monthFilter ||
    (createdDate &&
      createdDate.toISOString().slice(0, 7) === monthFilter);

  const matchesCupboard =
    rcCupboardFilter === "all" || item.cupboard === rcCupboardFilter;

  const matchesVendor =
    rcVendorFilter === "all" || item.vendor === rcVendorFilter;

  const matchesMachine =
    rcMachineFilter === "all" || item.machine === rcMachineFilter;

  const matchesCategory =
    rcCategoryFilter === "all" ||
    (rcCategoryFilter === "Spare Parts" && item.maintenanceCategory === "SPARE_PART") ||
    (rcCategoryFilter === "Consumables" && item.maintenanceCategory === "CONSUMABLE");

  const matchesMaterialType =
    rcMaterialTypeFilter === "all" || item.materialType === rcMaterialTypeFilter;

  return (
    matchesDateFrom &&
    matchesDateTo &&
    matchesMonth &&
    matchesCupboard &&
    matchesVendor &&
    matchesMachine &&
    matchesCategory &&
    matchesMaterialType
  );
});


  const handleExcelExport = () => {
    const data = reportFilteredData.map(i => ({
      "Item Code": i.code, "Description": i.desc, "Machine": i.machine, "Location": i.location,
      "Maintenance Category": i.maintenanceCategory || "—", "Material Type": i.materialType || "—",
      "Quantity": i.qty, "Min Qty": i.minQty, "Vendor": i.vendor, "Status": getStockStatus(i.qty, i.minQty),
    }));
    exportToExcel(data, `Inventory_Report_${new Date().toISOString().split("T")[0]}`);
  };

  const handlePdfExport = () => {
    let rows = reportFilteredData.map(i =>
      `<tr><td>${i.code}</td><td>${i.desc}</td><td>${i.machine}</td><td>${i.location}</td><td>${i.maintenanceCategory || "—"}</td><td>${i.materialType || "—"}</td><td>${i.qty}</td><td>${i.minQty}</td><td>${i.vendor}</td><td>${getStockStatus(i.qty, i.minQty)}</td></tr>`
    ).join("");
    const table = `<table><thead><tr><th>Item Code</th><th>Description</th><th>Machine</th><th>Location</th><th>Maint. Category</th><th>Material Type</th><th>Qty</th><th>Min Qty</th><th>Vendor</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="10" style="text-align:center;padding:20px;">No records</td></tr>'}</tbody></table>`;
    const filters = [
      statusFilter !== "all" ? `Status: ${statusFilter}` : "",
      cupboardFilter !== "all" ? `Cupboard: ${cupboardFilter}` : "",
      vendorFilter !== "all" ? `Vendor: ${vendorFilter}` : "",
      categoryFilter !== "all" ? `Maintenance Category: ${categoryFilter}` : "",
      materialTypeFilter !== "all" ? `Material Type: ${materialTypeFilter}` : "",
      search ? `Search: ${search}` : "",
    ].filter(Boolean).join(" | ") || "All records";
    printPdfReport(table, "Inventory Stock Report", `Filters: ${filters}`, user?.name);
  };

  const managerUsageLogs = usageLogs;

  const tabs: { key: Tab; label: string; roles: string[] }[] = [
    { key: "stock", label: "Inventory Stock", roles: ["Operator", "Admin", "Manager", "High Authority"] },
    { key: "add", label: "Add Material", roles: ["Admin", "Manager", "High Authority"] },
    { key: "manager", label: "Manager View", roles: ["Manager", "High Authority"] },
  ];

  return (
    <AppLayout lowStockCount={lowStockCount}>
      <div>
        <div className="flex gap-0 border-b border-border mb-6">
          {tabs.filter(t => user && t.roles.includes(user.role)).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "stock" && (
          <div className="space-y-4">
            {/* Report Center */}
            <div className="bg-card border border-border p-4">
              <h3 className="section-title">Report Center</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Date From</Label>
                  <Input type="date" className="mt-1 h-8 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Date To</Label>
                  <Input type="date" className="mt-1 h-8 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Month</Label>
                  <Input type="month" className="mt-1 h-8 text-xs" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Newly Bought</Label>
                  <div className="mt-2"><Switch checked={newlyBought} onCheckedChange={setNewlyBought} /></div>
                </div>
                <div>
                  <Label className="text-xs">Maintenance Category</Label>
                  <Select value={rcCategoryFilter} onValueChange={setRcCategoryFilter}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Material Type</Label>
                  <Select value={rcMaterialTypeFilter} onValueChange={setRcMaterialTypeFilter}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cupboard</Label>
                  <SearchableSelect value={rcCupboardFilter} onValueChange={setRcCupboardFilter} options={cupboards} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Vendor</Label>
                  <SearchableSelect value={rcVendorFilter} onValueChange={setRcVendorFilter} options={vendors} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Machine</Label>
                  <SearchableSelect value={rcMachineFilter} onValueChange={setRcMachineFilter} options={machines} className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs"><FileText className="h-3.5 w-3.5 mr-1.5" />Generate Report</Button>
                {canExport && (
                  <>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handlePdfExport}><FileDown className="h-3.5 w-3.5 mr-1.5" />Download as PDF</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExcelExport}><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />Download as Excel</Button>
                  </>
                )}    
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-card border border-border p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search item code or description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-56 text-xs" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {materialTypes.length > 0 && (
                  <Select value={materialTypeFilter} onValueChange={setMaterialTypeFilter}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <SearchableSelect value={cupboardFilter} onValueChange={setCupboardFilter} options={cupboards} allLabel="All Cupboards" className="w-36" />
                <SearchableSelect value={machineFilter} onValueChange={setMachineFilter} options={machines} allLabel="All Machines" className="w-36" />
                <SearchableSelect value={vendorFilter} onValueChange={setVendorFilter} options={vendors} allLabel="All Vendors" className="w-36" />
              </div>
            </div>

            {/* Stock Table */}
            <div className="bg-card border border-border p-5">
              <h3 className="section-title mb-4">Stock Overview</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Description</th>
                      <th>Machine</th>
                      <th>Location</th>
                      <th>Maint. Category</th>
                      <th>Material Type</th>
                      <th>Vendor</th>
                      <th>Qty</th>
                      <th>Min Qty</th>
                      <th>Stock Level</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={12} className="text-center text-sm text-muted-foreground py-8">No inventory records available.</td></tr>
                    ) : filtered.map((item) => {
                      const status = getStockStatus(item.qty, item.minQty);
                      const pct = getStockPercent(item.qty, item.minQty);
                      return (
                        <tr key={item.code}>
                          <td className="font-medium">{item.code}</td>
                          <td>{item.desc}</td>
                          <td>{item.machine}</td>
                          <td>{item.location}</td>
                          <td className="text-xs">
  {item.maintenanceCategory === "SPARE_PART"
    ? "Spare Parts"
    : item.maintenanceCategory === "CONSUMABLE"
    ? "Consumables"
    : item.maintenanceCategory || "—"}
</td>
                          <td className="text-xs">{item.materialType || "—"}</td>
                          <td className="text-xs">{item.vendor}</td>
                          <td>{item.qty}</td>
                          <td>{item.minQty}</td>
                          <td className="min-w-[100px]">
                            <div className="h-1.5 w-full bg-muted">
                              <div className={`h-full ${status === "In Stock" ? "bg-success" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td>
                            <span className={`text-xs font-medium px-2 py-0.5 ${status === "In Stock" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {status}
                            </span>
                          </td>
                          <td className="text-right">
                            <InventoryActionMenu
                              canEdit={canEdit}
                              onEdit={() => setEditItem(item)}
                              onUse={() => setUseItem(item)}
                              onHistory={() => {
  setHistoryItem(item);
  fetchTransactions(String(item.id), item.code);
}}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Showing {filtered.length} of {inventoryData.length} items</span>
              </div>
            </div>
          </div>
        )}

        {tab === "add" && (
          <div className="bg-card border border-border p-5 max-w-2xl">
            <h3 className="section-title">Add New Material</h3>
            <div className="form-grid">
              <div><Label className="text-xs">Item Code</Label><Input className="mt-1" placeholder="AE-XXXX" value={addForm.code} onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))} /></div>
              <div><Label className="text-xs">Description</Label><Input className="mt-1" placeholder="Material description" value={addForm.desc} onChange={e => setAddForm(p => ({ ...p, desc: e.target.value }))} /></div>
              <div><Label className="text-xs">Machine Name</Label><Input className="mt-1" placeholder="e.g. CNC-04" value={addForm.machine} onChange={e => setAddForm(p => ({ ...p, machine: e.target.value }))} /></div>
              <div><Label className="text-xs">Cupboard No.</Label><Input className="mt-1" placeholder="e.g. C3" value={addForm.cupboard} onChange={e => setAddForm(p => ({ ...p, cupboard: e.target.value }))} /></div>
              <div><Label className="text-xs">Rack No.</Label><Input className="mt-1" placeholder="e.g. R2" value={addForm.rack} onChange={e => setAddForm(p => ({ ...p, rack: e.target.value }))} /></div>
              <div><Label className="text-xs">Quantity</Label><Input className="mt-1" type="number" placeholder="0" value={addForm.qty} onChange={e => setAddForm(p => ({ ...p, qty: e.target.value }))} /></div>
              <div><Label className="text-xs">Min Required Qty</Label><Input className="mt-1" type="number" placeholder="0" value={addForm.minQty} onChange={e => setAddForm(p => ({ ...p, minQty: e.target.value }))} /></div>
              <div><Label className="text-xs">Date & Time</Label><Input className="mt-1" value={new Date().toLocaleString()} disabled /></div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Maintenance Classification</h4>
              <div className="form-grid">
                <div>
                  <Label className="text-xs">Maintenance Category</Label>
                  <Select value={addForm.maintenanceCategory} onValueChange={v => setAddForm(p => ({ ...p, maintenanceCategory: v, materialType: v !== "Spare Parts" ? "" : p.materialType }))}>
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {addForm.maintenanceCategory === "Spare Parts" && (
                  <div>
                    <Label className="text-xs">Material Type <span className="text-destructive">*</span></Label>
                    <Input className="mt-1" placeholder="e.g. Bearings, Filters, Hydraulic Parts" value={addForm.materialType} onChange={e => setAddForm(p => ({ ...p, materialType: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Vendor Details</h4>
              <div className="form-grid">
                <div><Label className="text-xs">Vendor Name</Label><Input className="mt-1" placeholder="Vendor company name" value={addForm.vendorName} onChange={e => setAddForm(p => ({ ...p, vendorName: e.target.value }))} /></div>
                <div><Label className="text-xs">Contact Number</Label><Input className="mt-1" placeholder="+91 XXXXX XXXXX" value={addForm.vendorContact} onChange={e => setAddForm(p => ({ ...p, vendorContact: e.target.value }))} /></div>
                <div><Label className="text-xs">Email</Label><Input className="mt-1" type="email" placeholder="vendor@company.com" value={addForm.vendorEmail} onChange={e => setAddForm(p => ({ ...p, vendorEmail: e.target.value }))} /></div>
                <div><Label className="text-xs">Address</Label><Input className="mt-1" placeholder="Full address" value={addForm.vendorAddress} onChange={e => setAddForm(p => ({ ...p, vendorAddress: e.target.value }))} /></div>
              </div>
            </div>

            <Button className="mt-4" onClick={handleAddMaterial} disabled={!addForm.code.trim() || !addForm.desc.trim()}>Submit Material</Button>
          </div>
        )}

        {tab === "manager" && (
          <div className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">Usage Logs & Approvals</h3>
              <Input placeholder="Filter by date..." className="w-40 h-8 text-xs" type="date" />
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Operator</th><th>Item Code</th><th>Qty Used</th><th>Purpose</th><th>Date</th><th>Time</th></tr>
              </thead>
              <tbody>
                {managerUsageLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-sm text-muted-foreground py-8">No usage logs available.</td></tr>
                ) : managerUsageLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.operatorName}</td>
                    <td className="font-medium">{log.itemCode}</td>
                    <td>{log.qtyUsed}</td>
                    <td>{log.purpose}</td>
                    <td>{log.date}</td>
                    <td>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modals */}
        <EditMaterialModal item={editItem} open={!!editItem} onClose={() => setEditItem(null)} onSave={handleEditSave} />
        <UseMaterialModal item={useItem} open={!!useItem} onClose={() => setUseItem(null)} onSubmit={handleUseMaterial} isOperator={isOperator} />
        {historyItem && (
          <HistoryModal
            itemCode={historyItem.code}
            logs={transactions || []}
            open={!!historyItem}
            onClose={() => setHistoryItem(null)}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Inventory;
