import { useState, useEffect } from "react";
import { api } from "@shared/routes";

interface User {
  id: number;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(api.auth.me.path);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError("Failed to check authentication");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch(api.auth.logout.path, { method: "POST" });
      setUser(null);
    } catch (err) {
      setError("Failed to logout");
    }
  };

  return { user, isLoading, error, logout };
}
