import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================
// REQUEST INTERCEPTOR
// ============================

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================
// RESPONSE INTERCEPTOR
// ============================

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 & not already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh");

        if (!refresh) {
          throw new Error("No refresh token");
        }

        const refreshResponse = await axios.post(
          "http://127.0.0.1:8000/api/auth/token/refresh/",
          { refresh }
        );

        const newAccess = refreshResponse.data.access;

        localStorage.setItem("access", newAccess);

        //  IMPORTANT: attach new token to retry request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh failed → force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        window.location.href = "/";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;