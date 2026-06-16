import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, Edit3, Mail, Save, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ApiResponse, UserDto } from "@trip-planner/shared";
import { Badge, Button, Card, CountUp, Input, Skeleton } from "../components/ui";
import { useToast } from "../components/toast";
import { api, type ItineraryList } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";

function initials(name?: string) {
  return (name ?? "TP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [message, setMessage] = useState("");
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get<ApiResponse<UserDto>>("/users/me")).data.data
  });
  const { data: itineraryData } = useQuery({
    queryKey: ["profile-itineraries"],
    queryFn: async () => (await api.get<ApiResponse<ItineraryList>>("/itinerary", { params: { limit: 50, sort: "-createdAt" } })).data.data
  });
  const update = useMutation({
    mutationFn: async () => (await api.patch<ApiResponse<UserDto>>("/users/me", { name })).data.data,
    onSuccess: (updated) => {
      updateUser(updated);
      queryClient.setQueryData(["profile"], updated);
      setMessage("Profile updated successfully.");
      setIsEditing(false);
      toast({ type: "success", title: "Profile updated", message: "Your display name has been saved." });
    },
    onError: (error) => {
      const errorMessage = axios.isAxiosError<ApiResponse<null>>(error) ? error.response?.data?.message ?? "Could not update profile." : "Could not update profile.";
      setMessage(errorMessage);
      toast({ type: "error", title: "Update failed", message: errorMessage });
    }
  });

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  const stats = useMemo(() => {
    const items = itineraryData?.items ?? [];
    return {
      total: itineraryData?.total ?? 0,
      latest: items[0]?.createdAt ?? null,
      joined: profile?.createdAt ?? user?.createdAt ?? null
    };
  }, [itineraryData, profile, user]);

  const current = profile ?? user;
  if (isLoading && !current) return <Skeleton className="h-72" />;

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-primary p-6 text-white">
          <Badge className="border-white/20 bg-white/10 text-white">Account settings</Badge>
          <h1 className="mt-4 text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-sm text-white/80">Manage your travel workspace identity and account overview.</p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
          <div className="text-center lg:text-left">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary lg:mx-0">
              {current?.avatar ? <img src={current.avatar} alt="" className="h-full w-full rounded-2xl object-cover" /> : initials(current?.name)}
            </div>
            <h2 className="mt-4 text-xl font-bold">{current?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{current?.authProvider === "google" ? "Google account" : "Email account"}</p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Name
                <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!isEditing || update.isPending} minLength={2} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Email
                <Input value={current?.email ?? ""} disabled />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <Button disabled={update.isPending || name.trim().length < 2} onClick={() => update.mutate()}><Save size={16} /> {update.isPending ? "Saving" : "Save"}</Button>
                  <Button className="bg-surface text-foreground hover:bg-muted" onClick={() => { setName(current?.name ?? ""); setIsEditing(false); }}><X size={16} /> Cancel</Button>
                </>
              ) : (
                <Button onClick={() => { setIsEditing(true); toast({ type: "info", title: "Editing profile", message: "Update your name, then save changes." }); }}><Edit3 size={16} /> Edit profile</Button>
              )}
            </div>
            {message && <p className="rounded-md bg-muted px-3 py-2 text-sm text-slate-600">{message}</p>}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <ProfileStat icon={CalendarDays} label="Generated itineraries" value={stats.total} count />
        <ProfileStat icon={UserRound} label="Joined" value={formatDate(stats.joined)} />
        <ProfileStat icon={Mail} label="Last itinerary" value={formatDate(stats.latest)} />
      </div>
    </section>
  );
}

function ProfileStat({ icon: Icon, label, value, count = false }: { icon: typeof CalendarDays; label: string; value: string | number; count?: boolean }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary"><Icon size={20} /></div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-bold">{count && typeof value === "number" ? <CountUp value={value} /> : value}</p>
      </div>
    </Card>
  );
}
