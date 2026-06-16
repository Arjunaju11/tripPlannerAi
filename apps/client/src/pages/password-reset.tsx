import axios from "axios";
import { KeyRound, Mail, ShieldCheck, type LucideIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { ApiResponse } from "@trip-planner/shared";
import { Badge, Button, Card, Input } from "../components/ui";
import { useToast } from "../components/toast";
import { api } from "../lib/api";

const genericForgotMessage = "If an account exists with this email, a reset link has been sent.";

function getErrorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError<ApiResponse<null>>(error)
    ? error.response?.data?.message ?? fallback
    : fallback;
}

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage(genericForgotMessage);
      toast({ type: "success", title: "Reset link requested", message: genericForgotMessage });
    } catch (err) {
      const nextError = getErrorMessage(err, "Password reset email is currently unavailable. Try again later.");
      setError(nextError);
      toast({ type: "error", title: "Reset request failed", message: nextError });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordShell
      badge="Account recovery"
      title="Reset your password"
      description="Enter your account email and we will send a secure reset link if the account exists."
      icon={Mail}
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required autoComplete="email" />
        {message && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button disabled={loading} className="w-full">{loading ? "Sending..." : "Send reset link"}</Button>
      </form>
      <p className="mt-4 text-sm">
        Remembered your password? <Link className="font-semibold text-primary" to="/login">Back to login</Link>
      </p>
    </PasswordShell>
  );
}

export function ResetPasswordPage() {
  const { token } = useParams();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password, confirmPassword });
      const message = "Your password has been reset. You can now login with the new password.";
      setSuccess(message);
      toast({ type: "success", title: "Password reset", message });
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const nextError = getErrorMessage(err, "Reset link is invalid or expired.");
      setError(nextError);
      toast({ type: "error", title: "Reset failed", message: nextError });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordShell
      badge="Secure reset"
      title="Create a new password"
      description="Choose a new password for your TripPlannerAI account. Reset links are single-use and expire quickly."
      icon={KeyRound}
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required minLength={8} autoComplete="new-password" />
        <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" required minLength={8} autoComplete="new-password" />
        {success && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button disabled={loading || !token} className="w-full">{loading ? "Resetting..." : "Reset password"}</Button>
      </form>
      <p className="mt-4 text-sm">
        Ready to continue? <Link className="font-semibold text-primary" to="/login">Login</Link>
      </p>
    </PasswordShell>
  );
}

function PasswordShell({
  badge,
  title,
  description,
  icon: Icon,
  children
}: {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[70vh] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="mx-auto w-full max-w-md">
        <Badge>{badge}</Badge>
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        {children}
      </Card>
      <div className="hidden space-y-4 lg:block">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={28} />
        </div>
        <h2 className="max-w-xl text-4xl font-bold leading-tight">Secure account recovery for your travel workspace.</h2>
        <div className="grid max-w-xl gap-3">
          {["Reset links expire in 30 minutes", "Tokens are stored hashed, never raw", "Google-only accounts are not revealed"].map((item) => (
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
