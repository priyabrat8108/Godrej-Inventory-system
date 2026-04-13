import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  loginUser,
  registerUser,
  initializeSystemApi,
  getProfile,
  logoutAll,
  checkInitializationStatus,
} from "@/lib/api/auth";

type Role = "Operator" | "Admin" | "Manager" | "High Authority";

interface User {
  name: string;
  email: string;
  role: Role;
}



interface RegisteredUser {
  name: string
  email: string
  role: Role
  mobile?: string
  employeeId?: string
  status: "Pending" | "Approved" | "Rejected"
}


interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "Operator" | "Admin";
  mobile?: string;
  employeeId?: string;
}

interface InitializeData {
  full_name: string;
  email: string;
  password: string;
}


interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isInitialized: boolean | null

  registeredUsers: RegisteredUser[]
  approveUser: (email: string) => void
  rejectUser: (email: string) => void

  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>

  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; message: string }>

  initializeSystem: (
    data: InitializeData
  ) => Promise<{ success: boolean; message: string }>

  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null);

/* ========================= */
/* 🔄 MAP BACKEND ROLE */
/* ========================= */

const mapBackendRole = (role: string): Role => {
  switch (role) {
    case "OPERATOR":
      return "Operator";
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "HIGH_AUTHORITY":
      return "High Authority";
    default:
      return "Operator";
  }
};

/* ========================= */
/* 🚀 PROVIDER */
/* ========================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  /* ========================= */
  /* CHECK SYSTEM INIT STATUS */
  /* ========================= */

  useEffect(() => {
  const checkInit = async () => {
    try {
      const res = await checkInitializationStatus();
      const data = res.data || res;

      setIsInitialized(
        data.is_initialized ??
        data.isInitialized ??
        false
      );
    } catch (error) {
      console.error("Initialization check failed:", error);
      setIsInitialized(false); // <-- FIXED
    }
  };

  checkInit();
}, []);

  /* ========================= */
  /* AUTO LOAD USER ON REFRESH */
  /* ========================= */

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (localStorage.getItem("access")) {
          const res = await getProfile();
          const backendUser = res.data;

          setUser({
            name: backendUser.full_name,
            email: backendUser.email,
            role: mapBackendRole(backendUser.role),
          });
        }
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      }
    };

    loadUser();
  }, []);

  /* ========================= */
  /* 🔐 LOGIN */
  /* ========================= */

  const login = async (email: string, password: string) => {
    try {
      const res = await loginUser(email, password);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      const profileRes = await getProfile();
      const backendUser = profileRes.data;

      setUser({
        name: backendUser.full_name,
        email: backendUser.email,
        role: mapBackendRole(backendUser.role),
      });

      return { success: true, message: "" };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Login failed.",
      };
    }
  };

  /* ========================= */
  /* 📝 REGISTER */
  /* ========================= */

  const register = async (data: RegisterData) => {
    try {
      await registerUser({
  full_name: data.name,
  email: data.email,
  password: data.password,
  role: data.role.toUpperCase()
});     
      return { success: true, message: "" };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Registration failed.",
      };
    }
  };

  /* ========================= */
  /* 🏁 INITIALIZE SYSTEM */
  /* ========================= */

  const initializeSystem = async (
  data: InitializeData
): Promise<{ success: boolean; message: string }> => {
  try {
    await initializeSystemApi(data);
    setIsInitialized(true);
    return { success: true, message: "" };
  } catch (err: any) {
    console.log("INIT ERROR:", err.response?.data);
    return {
      success: false,
      message:
        JSON.stringify(err.response?.data) || "Initialization failed.",
    };
  }
};

  /* ========================= */
  /* 🚪 LOGOUT */
  /* ========================= */

  const logout = async () => {
    try {
      await logoutAll();
    } catch {
      // ignore backend error
    }

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  const approveUser = (email: string) => {
  setRegisteredUsers(prev =>
    prev.map(u =>
      u.email === email ? { ...u, status: "Approved" } : u
    )
  );
};

const rejectUser = (email: string) => {
  setRegisteredUsers(prev =>
    prev.map(u =>
      u.email === email ? { ...u, status: "Rejected" } : u
    )
  );
};

  /* ========================= */
  /* ⛔ WAIT UNTIL INIT CHECK DONE */
  /* ========================= */

  if (isInitialized === null) {
    return null; // prevents flicker
  }

  return (
    <AuthContext.Provider
  value={{
    user,
    isLoggedIn: !!user,
    isInitialized,

    registeredUsers,
    approveUser,
    rejectUser,

    login,
    register,
    initializeSystem,
    logout,
  }}
>
      {children}
    </AuthContext.Provider>
  );
}

/* ========================= */
/* 🪝 HOOK */
/* ========================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
