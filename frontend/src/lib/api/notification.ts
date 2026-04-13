import axios from "@/lib/axios";

export const fetchNotifications = async () => {
  const { data } = await axios.get("notifications/");
  return data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await axios.patch(`notifications/${id}/read/`);
  return data;
};



export const fetchUnreadCount = () =>
  axios.get("/notifications/unread-count/");



export const markAllNotificationsRead = () =>
  axios.post("/notifications/read-all/");