import { useEffect, useState, type ReactNode } from "react";
import type { ApiResponse, UserDto } from "@trip-planner/shared";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    api
      .post<ApiResponse<{ accessToken: string; user: UserDto }>>("/auth/refresh")
      .then((res) => setSession(res.data.data.user, res.data.data.accessToken))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [setSession]);

  if (!ready) return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  return children;
}
