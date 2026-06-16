import { ArrowRight, CalendarDays, FileText, MapPinned, Share2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Card } from "../components/ui";

const steps = [
  { icon: FileText, title: "Upload bookings", text: "Drop flight tickets, hotel PDFs, or travel screenshots." },
  { icon: Sparkles, title: "Extract with AI", text: "OCR and AI convert messy documents into structured travel facts." },
  { icon: CalendarDays, title: "Plan instantly", text: "Get day-wise cards with places, food, stays, transport, and tips." },
  { icon: Share2, title: "Share or export", text: "Send a public link or download a clean PDF itinerary." }
];


export function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="grid min-h-[78vh] gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="stagger space-y-6">
          <Badge>AI travel document intelligence</Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Turn tickets and hotel bookings into a polished trip plan.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              TripPlannerAI reads travel PDFs and images, extracts booking details, generates smart recommendations, and creates a shareable itinerary workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/upload">
              <Button>Start planning <ArrowRight size={16} /></Button>
            </Link>
            <Link to="/register">
              <Button className="bg-surface text-foreground hover:bg-muted">Create account</Button>
            </Link>
          </div>
        </div>

        <div className="reveal-card relative min-h-[520px] overflow-hidden rounded-lg border border-border bg-surface/80 shadow-lg backdrop-blur-xl">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80"
            alt="A scenic travel destination with a lake and mountains"
            className="hero-photo-mask absolute inset-0 h-full w-full object-cover opacity-70"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/50 to-background/95" />
          <Card className="absolute bottom-5 left-5 right-5 overflow-hidden p-0">
          <div className="bg-primary p-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Generated itinerary</p>
            <h2 className="mt-2 text-2xl font-bold">Dubai stopover from Kochi</h2>
            <p className="mt-2 text-sm text-white/80">25 Jun - 28 Jun 2026</p>
          </div>
          <div className="space-y-4 p-5">
            {["Flight EK533: Kochi to Dubai", "Stay: Marina Bay Suites Dubai", "Places: Dubai Creek, Al Seef, Downtown", "Food: Emirati breakfast, waterfront dinner"].map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
          </Card>
        </div>
      </section>

      <section className="stagger grid gap-4 md:grid-cols-4">
        {steps.map((step) => (
          <Card key={step.title} className="reveal-card hover:-translate-y-1 hover:shadow-lg">
            <step.icon className="mb-4 h-8 w-8 text-primary" />
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
          </Card>
        ))}
      </section>

      <Card className="flex flex-col gap-4 bg-primary/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Built for real travel workflows</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Upload, edit, checklist, share, and export from one workspace.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary"><MapPinned size={18} /> Travel-ready output</div>
      </Card>
    </div>
  );
}
