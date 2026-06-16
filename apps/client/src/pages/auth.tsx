import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { PlaneTakeoff, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ApiResponse } from "@trip-planner/shared";
import { Badge, Button, Card, Input } from "../components/ui";
import { useToast } from "../components/toast";
import { api, type LoginResponse } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";

export function LoginPage() {
  return <AuthForm mode="login" />;
}

export function RegisterPage() {
  return <AuthForm mode="register" />;
}

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const payload = Object.fromEntries(formData);
      const res = await api.post<ApiResponse<LoginResponse>>(`/auth/${mode}`, payload);
      setSession(res.data.data.user, res.data.data.accessToken);
      toast({
        type: "success",
        title: mode === "login" ? "Logged in successfully" : "Account created",
        message: mode === "login" ? "Welcome back to your travel workspace." : "Your TripPlannerAI account is ready."
      });
      navigate("/");
    } catch (err) {
      const message = axios.isAxiosError<ApiResponse<null>>(err)
        ? err.response?.data?.message ?? "Authentication failed. Check your details and try again."
        : "Authentication failed. Check your details and try again.";
      if (axios.isAxiosError<ApiResponse<null>>(err)) {
        setError(message);
      } else {
        setError(message);
      }
      toast({ type: "error", title: mode === "login" ? "Login failed" : "Registration failed", message });
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin(credential?: string) {
    if (!credential) return;
    try {
      const res = await api.post<ApiResponse<LoginResponse>>("/auth/google", { credential });
      setSession(res.data.data.user, res.data.data.accessToken);
      toast({ type: "success", title: "Google login successful", message: "Welcome to your itinerary workspace." });
      navigate("/");
    } catch {
      const message = "Google login failed. Check OAuth configuration and try again.";
      setError(message);
      toast({ type: "error", title: "Google login failed", message });
    }
  }

  return (
    <div className="grid min-h-[70vh] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="mx-auto w-full max-w-md">
        <Badge>{mode === "login" ? "Welcome back" : "Start your travel workspace"}</Badge>
        <h1 className="mt-4 text-3xl font-bold">{mode === "login" ? "Login to TripPlannerAI" : "Create your account"}</h1>
        <p className="mt-2 text-sm text-slate-500">Secure access with short-lived JWTs and an HttpOnly refresh cookie.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && <Input name="name" placeholder="Full name" required minLength={2} autoComplete="name" />}
          <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
          <Input name="password" type="password" placeholder="Password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          {mode === "login" && (
            <div className="text-right text-sm">
              <Link className="font-semibold text-primary" to="/forgot-password">Forgot password?</Link>
            </div>
          )}
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button disabled={loading} className="w-full">{loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}</Button>
        </form>
        {googleClientId ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 text-xs uppercase text-slate-400"><span className="h-px flex-1 bg-border" /> or continue with Google <span className="h-px flex-1 bg-border" /></div>
            <GoogleOAuthProvider clientId={googleClientId}>
              <div className="overflow-hidden rounded-md border border-border bg-surface p-2">
                <GoogleLogin onSuccess={(res) => void googleLogin(res.credential)} onError={() => setError("Google login failed")} text={mode === "login" ? "signin_with" : "signup_with"} width="100%" />
              </div>
            </GoogleOAuthProvider>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-slate-500">Google OAuth is disabled until VITE_GOOGLE_CLIENT_ID is configured.</p>
        )}
        <p className="mt-4 text-sm">
          {mode === "login" ? "No account?" : "Already registered?"}{" "}
          <Link className="font-semibold text-primary" to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Register" : "Login"}
          </Link>
        </p>
      </Card>
      <div className="hidden space-y-4 lg:block">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <PlaneTakeoff size={28} />
        </div>
        <h2 className="max-w-xl text-4xl font-bold leading-tight">Your bookings become a smart, editable travel plan.</h2>
        <div className="grid max-w-xl gap-3">
          {["Upload tickets and hotel bookings", "Generate day-wise recommendations", "Share a polished public itinerary"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-surface/80 p-4 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
