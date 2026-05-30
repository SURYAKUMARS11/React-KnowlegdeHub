import React, { createContext, useEffect, useMemo, useState } from "react";
import { fetchMe, logout as logoutRequest } from "../services/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Ignore logout errors; client state is still reset.
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setAuthLoading(true);
      try {
        const data = await fetchMe();
        if (isMounted) {
          setUser(data.user || null);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      authLoading,
    }),
    [user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
