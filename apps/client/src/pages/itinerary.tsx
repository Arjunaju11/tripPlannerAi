import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, CalendarDays, Copy, Download, ExternalLink, Lightbulb, MapPin, Pencil, Plus, Save, Soup, Star, Train, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { AIItinerary, ApiResponse, ItineraryDto } from "@trip-planner/shared";
import { Button, Card, Input, Skeleton } from "../components/ui";
import { useToast } from "../components/toast";
import { api } from "../lib/api";

type EditableDay = {
  day: number;
  date: string;
  title: string;
  attractions: string;
  restaurants: string;
  hotelRecommendations: string;
  transportSuggestions: string;
  travelTips: string;
};

type EditableItinerary = {
  title: string;
  summary: string;
  destination: AIItinerary["destination"];
  travelDates: AIItinerary["travelDates"];
  recommendations: AIItinerary["recommendations"];
  placeRecommendations: AIItinerary["placeRecommendations"];
  generatedAt: AIItinerary["generatedAt"];
  days: EditableDay[];
};

const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#0f172a" },
  title: { fontSize: 24, marginBottom: 8, fontWeight: 700 },
  summary: { color: "#475569", marginBottom: 16, lineHeight: 1.4 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 15, marginBottom: 6, fontWeight: 700 },
  row: { marginBottom: 4 },
  day: { paddingTop: 8, borderTop: "1px solid #e2e8f0", marginTop: 10 },
  muted: { color: "#64748b" }
});

function linesToText(items: string[]) {
  return items.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toEditable(itinerary: AIItinerary): EditableItinerary {
  return {
    title: itinerary.title,
    summary: itinerary.summary,
    destination: itinerary.destination,
    travelDates: itinerary.travelDates ?? { start: null, end: null },
    recommendations: itinerary.recommendations ?? { famousPlaces: [], restaurants: [], hotelsOrStayAreas: [], transport: [], tips: [] },
    placeRecommendations: itinerary.placeRecommendations ?? null,
    generatedAt: itinerary.generatedAt ?? null,
    days: itinerary.days.map((day) => ({
      day: day.day,
      date: day.date ?? "",
      title: day.title,
      attractions: linesToText(day.attractions ?? []),
      restaurants: linesToText(day.restaurants?.length ? day.restaurants : day.foodRecommendations ?? []),
      hotelRecommendations: linesToText(day.hotelRecommendations ?? []),
      transportSuggestions: linesToText(day.transportSuggestions ?? []),
      travelTips: linesToText(day.travelTips ?? [])
    }))
  };
}

function toAiItinerary(editable: EditableItinerary): AIItinerary {
  return {
    title: editable.title.trim(),
    summary: editable.summary.trim(),
    destination: editable.destination,
    travelDates: editable.travelDates,
    recommendations: editable.recommendations,
    placeRecommendations: editable.placeRecommendations,
    generatedAt: editable.generatedAt,
    days: editable.days.map((day, index) => ({
      day: index + 1,
      date: day.date.trim() || null,
      title: day.title.trim(),
      attractions: textToLines(day.attractions),
      restaurants: textToLines(day.restaurants),
      hotelRecommendations: textToLines(day.hotelRecommendations),
      foodRecommendations: textToLines(day.restaurants),
      transportSuggestions: textToLines(day.transportSuggestions),
      travelTips: textToLines(day.travelTips)
    }))
  };
}

function buildChecklist(itinerary: ItineraryDto) {
  const items = [
    "Passport or government ID",
    "Flight ticket and booking reference",
    "Hotel confirmation",
    "Airport transfer plan",
    "Travel insurance",
    "Boarding pass",
    itinerary.travelData.hotelAddress ? "Hotel address saved offline" : null,
    itinerary.travelData.returnDate ? "Return travel confirmed" : null,
    itinerary.travelData.notes.length > 0 ? "Review extracted notes" : null
  ];
  return items.filter((item): item is string => Boolean(item));
}

export function ItineraryDetailPage() {
  const { id } = useParams();
  return <ItineraryView endpoint={`/itinerary/${id}`} editable itineraryId={id} />;
}

export function SharedItineraryPage() {
  const { shareId } = useParams();
  return <ItineraryView endpoint={`/share/${shareId}`} />;
}

function ItineraryView({ endpoint, editable = false, itineraryId }: { endpoint: string; editable?: boolean; itineraryId?: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await api.get<ApiResponse<ItineraryDto>>(endpoint)).data.data
  });
  const [draft, setDraft] = useState<EditableItinerary | null>(null);

  useEffect(() => {
    if (data) setDraft(toEditable(data.aiItinerary));
  }, [data]);

  const save = useMutation({
    mutationFn: async (aiItinerary: AIItinerary) => (await api.patch<ApiResponse<ItineraryDto>>(`/itinerary/${itineraryId}`, { aiItinerary })).data.data,
    onSuccess: (updated) => {
      queryClient.setQueryData([endpoint], updated);
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      setIsEditing(false);
      toast({ type: "success", title: "Itinerary updated", message: "Your itinerary edits have been saved." });
    },
    onError: () => toast({ type: "error", title: "Update failed", message: "Could not save itinerary changes." })
  });

  const createShare = useMutation({
    mutationFn: async () => (await api.post<ApiResponse<ItineraryDto>>(`/share/${itineraryId}`, { expiresInDays: 7 })).data.data,
    onSuccess: async (updated) => {
      queryClient.setQueryData([endpoint], updated);
      await copyToClipboard(`${location.origin}/share/${updated.shareId}`);
    },
    onError: () => toast({ type: "error", title: "Sharing failed", message: "Could not create a public share link." })
  });

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyLabel("Copied");
    toast({ type: "success", title: "Copied", message: "Link copied to clipboard." });
    window.setTimeout(() => setCopyLabel("Copy link"), 1500);
  }

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data || !draft) return <Card>Itinerary not found.</Card>;

  const shareUrl = data.shareId ? `${location.origin}/share/${data.shareId}` : null;
  const currentItinerary = isEditing ? toAiItinerary(draft) : data.aiItinerary;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-semibold text-primary">{editable ? "Trip workspace" : "Shared itinerary"}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{currentItinerary.title}</h1>
          <p className="mt-2 text-slate-500">{currentItinerary.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{data.travelData.destinationCity ?? currentItinerary.destination ?? "Destination pending"}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-slate-600">{data.travelData.departureDate ?? "Flexible dates"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button className="bg-transparent text-foreground hover:bg-muted" onClick={() => {
              setIsEditing((value) => {
                const next = !value;
                toast({ type: "info", title: next ? "Edit mode enabled" : "Preview mode", message: next ? "Make changes and save when ready." : "Reviewing your itinerary." });
                return next;
              });
            }}>
              <Pencil size={16} /> {isEditing ? "Preview" : "Edit"}
            </Button>
          )}
          {editable && (
            <Button className="bg-transparent text-foreground hover:bg-muted" onClick={() => (shareUrl ? copyToClipboard(shareUrl) : createShare.mutate())}>
              <Copy size={16} /> {copyLabel}
            </Button>
          )}
          {!editable && (
            <Button className="bg-transparent text-foreground hover:bg-muted" onClick={() => copyToClipboard(location.href)}>
              <Copy size={16} /> {copyLabel}
            </Button>
          )}
          <PDFDownloadLink document={<ItineraryPdf itinerary={{ ...data, aiItinerary: currentItinerary }} />} fileName={`${currentItinerary.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`}>
            <Button onClick={() => toast({ type: "success", title: "PDF export started", message: "Your itinerary PDF is being prepared." })}><Download size={16} /> PDF</Button>
          </PDFDownloadLink>
        </div>
      </div>

      {isEditing ? (
        <ItineraryEditor draft={draft} setDraft={setDraft} onSave={() => save.mutate(toAiItinerary(draft))} isSaving={save.isPending} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <ExtractionPreview itinerary={data} />
            <TravelChecklist itinerary={data} />
          </div>
          <Timeline itinerary={data} />
          <RecommendationsPanel itinerary={{ ...data, aiItinerary: currentItinerary }} />
          <ItineraryDays itinerary={data} />
        </>
      )}
    </section>
  );
}

function ExtractionPreview({ itinerary }: { itinerary: ItineraryDto }) {
  const details = itinerary.travelData;
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Extracted booking details</h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Detail label="Passenger" value={details.travelerName} />
        <Detail label="Route" value={[details.departureCity, details.destinationCity].filter(Boolean).join(" to ") || null} />
        <Detail label="Departure" value={details.departureDate} />
        <Detail label="Return" value={details.returnDate} />
        <Detail label="Airline" value={details.airline} />
        <Detail label="Flight" value={details.flightNumber} />
        <Detail label="Hotel" value={details.hotelName} />
        <Detail label="Hotel address" value={details.hotelAddress} />
      </dl>
      {details.flights.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-slate-500">
              <tr><th className="py-2">Flight</th><th>From</th><th>To</th><th>Date</th></tr>
            </thead>
            <tbody>
              {details.flights.map((flight, index) => (
                <tr key={`${flight.flightNumber}-${index}`} className="border-b border-border/60">
                  <td className="py-2">{flight.flightNumber ?? "Pending"}</td>
                  <td>{flight.departureCity ?? "Unknown"}</td>
                  <td>{flight.destinationCity ?? "Unknown"}</td>
                  <td>{flight.departureDate ?? "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="font-medium">{value || "Not found"}</dd>
    </div>
  );
}

function TravelChecklist({ itinerary }: { itinerary: ItineraryDto }) {
  const items = useMemo(() => buildChecklist(itinerary), [itinerary]);
  const storageKey = `trip-checklist:${itinerary.id}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecked(JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, boolean>);
  }, [storageKey]);

  function toggle(item: string) {
    setChecked((current) => {
      const next = { ...current, [item]: !current[item] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const completed = items.filter((item) => checked[item]).length;
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Travel checklist</h2>
        <span className="text-sm text-slate-500">{completed}/{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={Boolean(checked[item])} onChange={() => toggle(item)} className="h-4 w-4 accent-primary" />
            <span className={checked[item] ? "text-slate-400 line-through" : ""}>{item}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function Timeline({ itinerary }: { itinerary: ItineraryDto }) {
  const events = [
    ...itinerary.travelData.flights.map((flight) => ({
      date: flight.departureDate ?? itinerary.travelData.departureDate ?? "Date pending",
      title: `${flight.flightNumber ?? "Flight"}: ${flight.departureCity ?? "Origin"} to ${flight.destinationCity ?? "Destination"}`,
      detail: flight.airline ?? "Flight booking"
    })),
    itinerary.travelData.hotelName
      ? {
          date: itinerary.travelData.departureDate ?? "Check-in date pending",
          title: `Check in at ${itinerary.travelData.hotelName}`,
          detail: itinerary.travelData.hotelAddress ?? "Hotel address pending"
        }
      : null,
    itinerary.travelData.returnDate
      ? {
          date: itinerary.travelData.returnDate,
          title: "Return or checkout",
          detail: "Confirm checkout and onward travel"
        }
      : null
  ].filter((event): event is { date: string; title: string; detail: string } => Boolean(event));

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><CalendarDays size={18} /> Smart trip timeline</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {events.map((event, index) => (
          <div key={`${event.title}-${index}`} className="rounded-md border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase text-primary">{event.date}</p>
            <h3 className="mt-1 font-semibold">{event.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{event.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecommendationsPanel({ itinerary }: { itinerary: ItineraryDto }) {
  const recommendations = itinerary.aiItinerary.recommendations ?? {
    famousPlaces: [],
    restaurants: [],
    hotelsOrStayAreas: [],
    transport: [],
    tips: []
  };
  const places = itinerary.aiItinerary.placeRecommendations ?? null;
  const hasTextRecommendations =
    recommendations.famousPlaces.length > 0 ||
    recommendations.restaurants.length > 0 ||
    recommendations.hotelsOrStayAreas.length > 0 ||
    recommendations.transport.length > 0 ||
    recommendations.tips.length > 0;
  const hasPlaceRecommendations = Boolean(places && (places.attractions.length || places.restaurants.length || places.hotels.length));

  if (!hasTextRecommendations && !hasPlaceRecommendations) {
    return (
      <Card className="text-center">
        <MapPin className="mx-auto mb-3 h-8 w-8 text-primary" />
        <h2 className="text-lg font-semibold">Destination recommendations</h2>
        <p className="mt-2 text-sm text-slate-500">Recommendations will appear when destination details are available.</p>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Destination recommendations</h2>
        <p className="mt-1 text-sm text-slate-500">AI suggestions are recommendations only. Confirm bookings and timings before travel.</p>
      </div>

      {places && (
        <div className="space-y-4">
          <RecommendationGrid title="Real place matches" cards={[...places.attractions, ...places.restaurants, ...places.hotels].map((place) => ({
            name: place.name,
            description: place.address ?? "Google Places result",
            meta: [place.rating ? `${place.rating.toFixed(1)} rating` : null, place.userRatingCount ? `${place.userRatingCount} reviews` : null].filter(Boolean).join(" · "),
            category: place.types.slice(0, 2).join(", ") || "Place",
            mapsUrl: place.mapsUrl,
            photoUrl: place.photoUrl
          }))} />
        </div>
      )}

      <RecommendationGrid title="Famous Places" cards={recommendations.famousPlaces.map((item) => ({
        name: item.name,
        description: item.description,
        meta: [item.bestTimeToVisit, item.estimatedVisitDuration].filter(Boolean).join(" · "),
        category: item.category
      }))} />
      <RecommendationGrid title="Restaurants" cards={recommendations.restaurants.map((item) => ({
        name: item.name,
        description: item.description,
        meta: [item.cuisine, item.area].filter(Boolean).join(" · "),
        category: item.category
      }))} />
      <RecommendationGrid title="Hotels / Stay Areas" cards={recommendations.hotelsOrStayAreas.map((item) => ({
        name: item.name,
        description: item.description,
        meta: item.area ?? "",
        category: item.category
      }))} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Train size={16} className="text-primary" /> Transport</h3>
          <div className="space-y-3">
            {recommendations.transport.length ? recommendations.transport.map((item) => (
              <div key={`${item.mode}-${item.description}`} className="rounded-md bg-muted/60 p-3 text-sm">
                <p className="font-semibold">{item.mode}</p>
                <p className="mt-1 text-slate-500">{item.description}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No transport recommendations yet.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Lightbulb size={16} className="text-primary" /> Travel Tips</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {recommendations.tips.length ? recommendations.tips.map((tip) => <li key={tip}>- {tip}</li>) : <li>No tips available yet.</li>}
          </ul>
        </Card>
      </div>
    </section>
  );
}

function RecommendationGrid({ title, cards }: { title: string; cards: Array<{ name: string; description: string; meta?: string; category?: string; mapsUrl?: string | null; photoUrl?: string | null }> }) {
  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={`${title}-${card.name}`} className="overflow-hidden p-0 hover:-translate-y-1 hover:shadow-lg">
            {card.photoUrl ? (
              <img src={getPhotoUrl(card.photoUrl)} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 via-muted to-surface text-primary">
                <MapPin size={34} />
              </div>
            )}
            <div className="space-y-3 p-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold">{card.name}</h4>
                  {card.meta?.includes("rating") && <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                </div>
                {card.category && <p className="mt-1 text-xs font-semibold uppercase text-primary">{card.category}</p>}
              </div>
              <p className="text-sm leading-6 text-slate-500">{card.description}</p>
              {card.meta && <p className="text-xs text-slate-400">{card.meta}</p>}
              {card.mapsUrl && (
                <a href={card.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Open in Maps <ExternalLink size={14} />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getPhotoUrl(photoUrl: string) {
  if (photoUrl.startsWith("http")) return photoUrl;
  const base = String(api.defaults.baseURL ?? "").replace(/\/api\/v1\/?$/, "");
  return `${base}${photoUrl}`;
}

function ItineraryDays({ itinerary }: { itinerary: ItineraryDto }) {
  return (
    <div className="grid gap-4">
      {itinerary.aiItinerary.days.map((day) => (
        <Card key={day.day}>
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{day.day}</div>
            <div>
              <h2 className="font-semibold">{day.title}</h2>
              <p className="text-sm text-slate-500">{day.date ?? "Flexible date"}</p>
            </div>
          </div>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <InfoList icon={MapPin} title="Places to Visit" items={day.attractions ?? []} fallback="Add attractions during planning." />
            <InfoList icon={Soup} title="Restaurants" items={day.restaurants?.length ? day.restaurants : day.foodRecommendations ?? []} fallback="Explore local recommendations." />
            <InfoList icon={BedDouble} title="Hotels / Stay Area" items={day.hotelRecommendations ?? []} fallback="Stay near transit and planned activities." />
            <InfoList icon={Train} title="Transport" items={day.transportSuggestions ?? []} fallback="Use local transit or rideshare." />
            <InfoList icon={Lightbulb} title="Tips" items={day.travelTips ?? []} fallback="Keep booking documents available offline." />
          </div>
        </Card>
      ))}
    </div>
  );
}

function InfoList({ icon: Icon, title, items, fallback }: { icon: typeof MapPin; title: string; items: string[]; fallback: string }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 font-semibold"><Icon size={16} className="text-primary" /> {title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-1 text-slate-600">
          {items.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="text-slate-500">{fallback}</p>
      )}
    </div>
  );
}

function ItineraryEditor({ draft, setDraft, onSave, isSaving }: { draft: EditableItinerary; setDraft: (draft: EditableItinerary) => void; onSave: () => void; isSaving: boolean }) {
  function updateDay(index: number, patch: Partial<EditableDay>) {
    setDraft({ ...draft, days: draft.days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)) });
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3">
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-label="Itinerary title" />
          <textarea
            value={draft.summary}
            onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            aria-label="Itinerary summary"
          />
        </div>
      </Card>
      {draft.days.map((day, index) => (
        <Card key={index}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Day {index + 1}</h2>
            <Button className="bg-red-600" disabled={draft.days.length === 1} onClick={() => setDraft({ ...draft, days: draft.days.filter((_, dayIndex) => dayIndex !== index) })}>
              <Trash2 size={16} />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={day.date} onChange={(event) => updateDay(index, { date: event.target.value })} placeholder="YYYY-MM-DD" />
            <Input value={day.title} onChange={(event) => updateDay(index, { title: event.target.value })} placeholder="Day title" />
            <EditList label="Places to visit" value={day.attractions} onChange={(value) => updateDay(index, { attractions: value })} />
            <EditList label="Restaurants" value={day.restaurants} onChange={(value) => updateDay(index, { restaurants: value })} />
            <EditList label="Hotels / stay area" value={day.hotelRecommendations} onChange={(value) => updateDay(index, { hotelRecommendations: value })} />
            <EditList label="Transport suggestions" value={day.transportSuggestions} onChange={(value) => updateDay(index, { transportSuggestions: value })} />
            <EditList label="Travel tips" value={day.travelTips} onChange={(value) => updateDay(index, { travelTips: value })} />
          </div>
        </Card>
      ))}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          className="bg-transparent text-foreground hover:bg-muted"
          onClick={() => setDraft({ ...draft, days: [...draft.days, { day: draft.days.length + 1, date: "", title: "New day", attractions: "", restaurants: "", hotelRecommendations: "", transportSuggestions: "", travelTips: "" }] })}
        >
          <Plus size={16} /> Add day
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          <Save size={16} /> {isSaving ? "Saving" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function EditList({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="One item per line"
        className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function ItineraryPdf({ itinerary }: { itinerary: ItineraryDto }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{itinerary.aiItinerary.title}</Text>
        <Text style={pdfStyles.summary}>{itinerary.aiItinerary.summary}</Text>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Booking Details</Text>
          <Text style={pdfStyles.row}>Passenger: {itinerary.travelData.travelerName ?? "Not found"}</Text>
          <Text style={pdfStyles.row}>Route: {[itinerary.travelData.departureCity, itinerary.travelData.destinationCity].filter(Boolean).join(" to ") || "Not found"}</Text>
          <Text style={pdfStyles.row}>Dates: {itinerary.travelData.departureDate ?? "Unknown"} to {itinerary.travelData.returnDate ?? "Unknown"}</Text>
          <Text style={pdfStyles.row}>Hotel: {itinerary.travelData.hotelName ?? "Not found"}</Text>
        </View>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Checklist</Text>
          {buildChecklist(itinerary).map((item) => <Text key={item} style={pdfStyles.row}>[ ] {item}</Text>)}
        </View>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Itinerary</Text>
          {itinerary.aiItinerary.days.map((day) => (
            <View key={day.day} style={pdfStyles.day}>
              <Text>Day {day.day}: {day.title}</Text>
              <Text style={pdfStyles.muted}>{day.date ?? "Flexible date"}</Text>
              <Text>Attractions: {(day.attractions ?? []).join(", ") || "To be planned"}</Text>
              <Text>Restaurants: {(day.restaurants?.length ? day.restaurants : day.foodRecommendations ?? []).join(", ") || "Local recommendations pending"}</Text>
              <Text>Hotels / Stay Area: {(day.hotelRecommendations ?? []).join(", ") || "Stay near planned activities"}</Text>
              <Text>Transport: {(day.transportSuggestions ?? []).join(", ") || "Use local transit or rideshare"}</Text>
              <Text>Tips: {(day.travelTips ?? []).join(", ") || "Keep documents available offline"}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
