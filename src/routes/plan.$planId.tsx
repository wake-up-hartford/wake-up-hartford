import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Circle, Phone, ExternalLink, Printer, AlertTriangle, Calendar, Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getPlan, toggleStep } from "@/lib/stabilization-plan.functions";
import { getResource } from "@/lib/ct-resources";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/plan/$planId")({
  head: () => ({ meta: [{ title: "Your 30-day plan" }] }),
  component: PlanPage,
});

// Lazy-loaded confetti — module is fetched only on first task-complete click.
let confettiPromise: Promise<(opts: Record<string, unknown>) => void> | null = null;
function fireConfetti(anchor: HTMLElement) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const rect = anchor.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  if (!confettiPromise) {
    confettiPromise = import("canvas-confetti").then(
      (m) => (m as unknown as { default: (opts: Record<string, unknown>) => void }).default,
    );
  }
  confettiPromise.then((confetti) => {
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 35,
      ticks: 120,
      origin: { x, y },
      colors: ["#7b3fbf", "#3aa3d8", "#f4a73a", "#3fa86b", "#f5f0e0"],
      disableForReducedMotion: true,
    });
  });
}


type StepRow = {
  id: string;
  week: number;
  domain: string;
  title: string;
  detail: string | null;
  resource_id: string | null;
  step_order: number;
  completed_at: string | null;
};

type PlanShape = {
  priority_summary: string;
  crisis_flags: { note: string; hotline: string }[];
  weeks: { week: number; focus: string; steps: unknown[] }[];
};

function PlanPage() {
  const { planId } = Route.useParams();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const fetchPlan = useServerFn(getPlan);
  const qc = useQueryClient();
  const toggleFn = useServerFn(toggleStep);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const BOOKMARK_KEY = "bookmarkedPlans";
  const [isBookmarked, setIsBookmarked] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "[]") as string[];
      setIsBookmarked(list.includes(planId));
    } catch { /* ignore */ }
  }, [planId]);
  const toggleBookmark = () => {
    try {
      const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "[]") as string[];
      const next = list.includes(planId) ? list.filter((id) => id !== planId) : [...list, planId];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      setIsBookmarked(next.includes(planId));
    } catch { /* ignore */ }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlan({ data: { planId } }),
    enabled: !!user,
  });

  const mut = useMutation({
    mutationFn: (vars: { stepId: string; done: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan", planId] }),
  });

  if (loading || isLoading) {
    return <AppShell><p className="text-muted-foreground">Loading your plan…</p></AppShell>;
  }
  if (error || !data) {
    return <AppShell><p className="text-destructive">{(error as Error)?.message ?? "Couldn't load plan."}</p></AppShell>;
  }

  const plan = data.plan.plan as PlanShape;
  const generatedAt = data.plan.generated_at as string | null;
  const steps = data.steps as StepRow[];
  const stepsByWeek = new Map<number, StepRow[]>();
  for (const s of steps) {
    const arr = stepsByWeek.get(s.week) ?? [];
    arr.push(s);
    stepsByWeek.set(s.week, arr);
  }
  const total = steps.length;
  const done = steps.filter((s) => s.completed_at).length;

  return (
    <AppShell>
      <Link to="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl leading-tight text-foreground">Your 30-Day Plan</h1>
          <button
            onClick={toggleBookmark}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this plan"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
              isBookmarked
                ? "border-gold bg-gold/10 text-gold"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
            {isBookmarked ? "Saved" : "Save"}
          </button>
        </div>
        {generatedAt && (
          <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-gold">
            <Calendar className="h-3 w-3" />
            Created on {new Date(generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
        {!user && (
          <Link
            to="/auth"
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
          >
            Sign In to receive plan via text/email
          </Link>
        )}
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          {user && (
            <span className="font-semibold text-foreground">
              {(() => {
                const raw = (user.user_metadata?.display_name as string) || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Friend";
                return raw.split(/\s+/)[0];
              })()},{" "}
            </span>
          )}
          {plan.priority_summary.charAt(0).toLowerCase() + plan.priority_summary.slice(1)}
        </p>
        <p className="mt-3 text-right text-[12px] font-semibold uppercase tracking-wider text-emerald-600">
          {done} of {total} steps completed
        </p>
      </div>

      {plan.crisis_flags?.length > 0 && (
        <div className="mb-5 rounded-2xl border-2 border-red-500/50 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[12px] font-semibold uppercase tracking-wider">Right now</span>
          </div>
          <ul className="space-y-2">
            {plan.crisis_flags.map((c, i) => (
              <li key={i} className="text-[14px] text-red-900">
                <p>{c.note}</p>
                <a href={`tel:${c.hotline.replace(/[^\d]/g, "")}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-red-700 underline">
                  <Phone className="h-3.5 w-3.5" /> {c.hotline}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {[1, 2, 3, 4].map((w) => {
          const weekMeta = plan.weeks.find((x) => x.week === w);
          const ws = stepsByWeek.get(w) ?? [];
          return (
            <div key={w} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-card-foreground">Week {w}</h2>
                {weekMeta && <span className="font-display text-[17px] leading-tight text-card-foreground">{weekMeta.focus}</span>}
              </div>
              <ul className="space-y-3">
                {ws.map((s) => {
                  const r = getResource(s.resource_id);
                  const isDone = !!s.completed_at;
                  return (
                    <li key={s.id} className="rounded-xl border border-border/70 bg-step-surface p-3">
                      <button
                        onClick={(e) => {
                          const willComplete = !isDone;
                          mut.mutate({ stepId: s.id, done: willComplete });
                          if (willComplete) fireConfetti(e.currentTarget);
                        }}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        {isDone ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-step-surface-muted" />
                        )}
                        <div className="flex-1">
                          <p className={`text-[14px] font-semibold ${isDone ? "text-step-surface-muted line-through" : "text-step-surface-foreground"}`}>
                            {s.title}
                          </p>
                          {s.detail && (
                            <p className="mt-1 text-[13px] leading-relaxed text-step-surface-foreground/90">{s.detail}</p>
                          )}
                          <span className="mt-1 inline-block rounded-full bg-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pill-foreground">
                            {s.domain}
                          </span>
                        </div>
                      </button>
                      {r && (
                        <div className="mt-3 rounded-lg border border-dashed border-border bg-step-resource p-3">
                          <p className="text-[13px] font-semibold text-step-resource-foreground">{r.name}</p>
                          <p className="text-[12px] text-step-resource-muted">{r.eligibility_notes}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                            {r.phone && r.phone !== "n/a" && (
                              <a href={`tel:${r.phone.replace(/[^\d]/g, "")}`} className="inline-flex items-center gap-1 text-success">
                                <Phone className="h-3.5 w-3.5" /> {r.phone}
                              </a>
                            )}
                            {r.url && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent">
                                <ExternalLink className="h-3.5 w-3.5" /> Website
                              </a>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-step-resource-muted">{r.town} · {r.hours}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {!user && (
        <Link
          to="/auth"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
        >
          Sign In to receive plan via text/email
        </Link>
      )}

      <button
        onClick={() => window.print()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground hover:bg-secondary/50"
      >
        <Printer className="h-4 w-4" /> Print this plan
      </button>
    </AppShell>
  );
}
