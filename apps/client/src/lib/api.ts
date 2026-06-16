import axios from "axios";
import type { ApiResponse, ItineraryDto, UserDto } from "@trip-planner/shared";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1",
  withCredentials: true
});

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  const requestUrl = String(original?.url ?? "");
  const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register") || requestUrl.includes("/auth/google") || requestUrl.includes("/auth/reset-password");

  if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
    original._retry = true;
    const res = await axios.post<ApiResponse<{ accessToken: string; user: UserDto }>>(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    setAccessToken(res.data.data.accessToken);
    original.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
    return api(original);
  }
  throw error;
});

export type LoginResponse = { user: UserDto; accessToken: string };
export type ItineraryList = { items: ItineraryDto[]; total: number; page: number; limit: number };
