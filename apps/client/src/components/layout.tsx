import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Moon, Plane, Sun } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";
import { useThemeStore } from "../stores/theme-store";
import { useToast } from "./toast";
import { Button } from "./ui";

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "relative rounded-md px-3 py-2 text-sm font-medium transition",
    isActive ? "nav-active bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
  ].join(" ");
}

export function Layout() {
  const { user, clear } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const toast = useToast();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Plane className="h-5 w-5" /></span>
            TripPlannerAI
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
                <NavLink to="/upload" className={navClass}>Upload</NavLink>
                <NavLink to="/profile" className={navClass}>Profile</NavLink>
                <Button
                  className="bg-transparent px-3 text-foreground shadow-none hover:bg-muted hover:shadow-none"
                  onClick={async () => {
                    try {
                      await api.post("/auth/logout");
                      toast({ type: "success", title: "Logged out", message: "You have been signed out successfully." });
                    } catch {
                      toast({ type: "error", title: "Logout sync failed", message: "You were signed out locally. Please close shared sessions manually." });
                    } finally {
                      clear();
                      navigate("/login");
                    }
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="rounded-md px-2 py-1 text-sm font-medium transition hover:bg-muted">Login</Link>
            )}
            <button aria-label="Toggle theme" onClick={toggle} className="rounded-md border border-border bg-surface p-2 transition hover:-translate-y-0.5 hover:shadow-sm">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </div>
      </header>
      <main className="page-enter mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
