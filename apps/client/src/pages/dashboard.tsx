import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Copy, FileText, Plus, Search, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { ApiResponse, ItineraryDto } from "@trip-planner/shared";
import { Badge, Button, Card, CountUp, Input, Skeleton } from "../components/ui";
import { useToast } from "../components/toast";
import { api, type ItineraryList } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";

function formatDate(value?: string | null) {
  if (!value) return "Flexible dates";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function itineraryDate(item: ItineraryDto) {
  return item.travelData.departureDate ?? item.createdAt;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("-createdAt");
  const [copiedId, setCopiedId] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["itineraries", q, page, sort],
    queryFn: async () => (await api.get<ApiResponse<ItineraryList>>("/itinerary", { params: { q, page, sort } })).data.data
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/itinerary/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      toast({ type: "success", title: "Itinerary deleted", message: "The itinerary was removed from your history." });
    },
    onError: () => toast({ type: "error", title: "Delete failed", message: "Could not delete this itinerary. Try again." })
  });
  const share = useMutation({
    mutationFn: async (id: string) => (await api.post<ApiResponse<ItineraryDto>>(`/share/${id}`, { expiresInDays: 7 })).data.data,
    onSuccess: async (item) => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      if (item.shareId) await copyShare(item.id, item.shareId);
    },
    onError: () => toast({ type: "error", title: "Sharing failed", message: "Could not create a share link." })
  });

  async function copyShare(id: string, shareId: string) {
    await navigator.clipboard.writeText(`${location.origin}/share/${shareId}`);
    setCopiedId(id);
    toast({ type: "success", title: "Link copied", message: "Share link copied to clipboard." });
    window.setTimeout(() => setCopiedId(""), 1500);
  }

  const items = data?.items ?? [];
  const latest = items[0];

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden bg-primary p-0 text-white">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold text-white/75">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
            <h1 className="mt-2 text-3xl font-bold">Your travel command center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Generate itineraries from booking documents, manage history, share plans, and export polished PDFs.</p>
          </div>
          <Link to="/upload"><Button className="bg-white text-primary hover:bg-white/90"><Plus size={16} /> Generate new itinerary</Button></Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label="Generated itineraries" value={data?.total ?? 0} count />
        <StatCard icon={Share2} label="Shared plans" value={items.filter((item) => item.shareId).length} count />
        <StatCard icon={CalendarDays} label="Latest trip" value={latest ? formatDate(itineraryDate(latest)) : "None yet"} />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search destination, title, or file name" value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} />
        </div>
        <select className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
        </select>
      </div>

      {isLoading && <Skeleton className="h-40" />}
      {!isLoading && items.length === 0 && (
        <Card className="grid min-h-72 place-items-center text-center">
          <div className="max-w-md">
            <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-xl font-bold">No itineraries yet</h2>
            <p className="mt-2 text-sm text-slate-500">Upload a travel booking PDF or image to generate your first itinerary workspace.</p>
            <Link to="/upload"><Button className="mt-5">Upload document</Button></Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="reveal-card hover:-translate-y-1 hover:shadow-lg">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <Link to={`/itinerary/${item.id}`} className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge>{item.travelData.destinationCity ?? item.aiItinerary.destination ?? "Destination pending"}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(itineraryDate(item))}</span>
                </div>
                <h2 className="text-lg font-semibold">{item.aiItinerary.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.aiItinerary.summary}</p>
              </Link>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-surface text-foreground hover:bg-muted" onClick={() => share.mutate(item.id)}>
                  <Copy size={16} /> {copiedId === item.id ? "Copied" : "Share"}
                </Button>
                {item.shareId && (
                  <Button className="bg-surface text-foreground hover:bg-muted" onClick={() => copyShare(item.id, item.shareId!)}>
                    Copy link
                  </Button>
                )}
                <Button className="bg-red-600" onClick={() => remove.mutate(item.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {data && data.total > data.limit && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span className="text-sm">Page {page}</span>
          <Button disabled={page * data.limit >= data.total} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      )}
    </section>
  );
}

function StatCard({ icon: Icon, label, value, count = false }: { icon: typeof FileText; label: string; value: string | number; count?: boolean }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary"><Icon size={22} /></div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold">{count && typeof value === "number" ? <CountUp value={value} /> : value}</p>
      </div>
    </Card>
  );
}
