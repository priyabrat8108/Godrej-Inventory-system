import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation} from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

/* ============================
   Backend Notification Type
============================ */

export interface Notification {
  id: string
  type: "usage" | "leave" | "leave_action" | string;
  timestamp: string
  read: boolean

  data: {
  employeeName?: string
  operatorName?: string
  itemCode?: string
  purpose?: string

  // ✅ ADD THESE
  materialName?: string
  message?: string

  leaveStart?: string
  leaveEnd?: string
  reason?: string
  action?: string

  date?: string
  assignedJobs?: string
}
}

/* ============================
   Context Type
============================ */

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (data: {
    type: string;
    message?: string;   // ✅ made optional
    data?: any;         // ✅ ADDED support for structured payload
  }) => Promise<void>;
}

/* ============================
   Context
============================ */

const NotificationContext =
  createContext<NotificationContextType | null>(null);

/* ============================
   Provider
============================ */

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notificationsData } = useQuery({
  queryKey: ["notifications"],
  queryFn: async () => {
    try {
      const res = await axios.get("/inventory/notifications/");
      const list = (res.data?.notifications || []).filter(
  (n: any) =>
    ["usage", "leave", "leave_action"].includes(n.type?.toLowerCase())
);

      return list.map((n: any) => {
        console.log("NOTIFICATION RAW:", n);
        const msg = n.message || "";

        

        return {
          id: String(n.id),
          type: n.type?.toLowerCase() || "unknown",
          read: n.is_read,

          // ✅ SAFE DATE FIX
          timestamp: n.created_at
            ? new Date(n.created_at).toLocaleString("en-GB")
            : "-",

          data: {
  operatorName:
    n.data?.operatorName ||
    msg.match(/used by (.+)$/)?.[1] ||
    "-",

  itemCode:
    n.data?.itemCode ||
    msg.match(/of (.+?) used/)?.[1] ||
    "-",

  materialName:
  n.data?.materialName ||
  msg.match(/of (.+?) used/)?.[1] ||   // ✅ correct for usage
  msg.match(/material (.+?) added/)?.[1] ||
  "-",

  purpose:
    n.data?.purpose ||
    msg.match(/for (.+)$/)?.[1] ||
    "-",

  message: msg
}
        };
      });

    } catch (error) {
      console.error("Notifications fetch failed", error);
      return [];
    }
  },
  enabled: !!user,
  retry: false,
  refetchInterval: 15000
});


  const { data: unreadData } = useQuery({
  queryKey: ["unread-count"],
  queryFn: async () => {
    try {
      const res = await axios.get("/inventory/notifications/");

const filteredUnread = (res.data?.notifications || []).filter(
  (n: any) =>
    !n.is_read &&
    n.type?.toLowerCase() !== "work_assignment"
);

return filteredUnread.length;
    } catch (error) {
      console.error("Unread count fetch failed", error);
      return 0; // ⭐ never undefined
    }
  },
  enabled: !!user,
  retry: false,
  refetchInterval: 15000
});

  const markMutation = useMutation({
    mutationFn: (id: string) =>
      axios.post(`/inventory/notifications/${id}/read/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      axios.post("/inventory/notifications/mark-read/"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const addNotificationMutation = useMutation({
  mutationFn: async (payload: {
    type: string;
    message?: string;
    data?: any;
  }) => {
    const res = await axios.post("/inventory/notifications/", payload);  // ⭐ FIXED
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  },
});

  return (
    <NotificationContext.Provider
      value={{
        notifications: notificationsData || [],
        unreadCount: unreadData || 0,
        markAsRead: (id: string) => markMutation.mutate(id),
        markAllAsRead: () => markAllMutation.mutate(),
        addNotification: async (data) =>
          await addNotificationMutation.mutateAsync(data),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/* ============================
   Hook
============================ */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
}