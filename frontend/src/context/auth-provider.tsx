// src/context/auth-provider.tsx
import { createContext, ReactNode, useMemo } from 'react';
import useSWR from "swr";
import { loginUser, logoutUser } from "@/api/auth";
import { User, AuthResponse } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. SWR Session Check
  // The fetcher is handled globally in App.tsx.
  // We use the key "/api/auth/check" to identify session data.
  const { data, isLoading, mutate } = useSWR<AuthResponse>("/api/auth/check", {
    shouldRetryOnError: false, // Don't retry if 401/500
    revalidateOnFocus: false, // Optional: Don't spam auth checks on tab switch
  });

  // 2. Derive User State from SWR Data
  const user: User | null = useMemo(() => {
    if (data && data.success) {
      return {
        username: data.username || "",
        role: data.role || "",
        fullName: data.full_name || "",
        isFirstLogin: data.is_first_login || false
      };
    }
    return null;
  }, [data]);

  // 3. Login Action
  const login = async (username: string, password: string) => {
    // Call API
    const authData = await loginUser(username, password);

    // Construct the user object locally
    const loggedInUser: User = {
      username: authData.username || "",
      role: authData.role || "",
      fullName: authData.full_name || "",
      isFirstLogin: authData.is_first_login || false
    };

    // Update SWR cache immediately (Optimistic UI)
    // passing 'true' as 2nd arg triggers revalidation to confirm with server
    await mutate({ ...authData, success: true }, true);

    return loggedInUser;
  };

  // 4. Logout Action
  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    // Clear SWR cache to update UI immediately
    await mutate({ success: false }, false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};