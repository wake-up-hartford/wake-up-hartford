import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { submitSurvey } from "@/lib/survey.functions";

export const Route = createFileRoute("/survey")({
  head: () => ({
    meta: [
      { title: "Quick Survey — Wake Up Wednesday" },
      { name: "description", content: "Help us improve Wake Up Wednesday by sharing your feedback." },
      { property: "og:title", content: "Quick Survey — Wake Up Wednesday" },
      { property: "og:description", content: "Help us improve Wake Up Wednesday by sharing your feedback." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/survey" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/survey" },
    ],
  }),
  component: SurveyPage,
});

const MOST_USED_OPTIONS = [
  { value: "path", label: "Path / plan steps" },
  { value: "find_help", label: "Find Help" },
  { value: "take_action", label: "Take Action & surveys" },
  { value: "home", label: "Home / dashboard" },
  { value: "none", label: "Haven't explored much yet" },
] as const;

const TECH_OPTIONS = [
  { value: "none", label: "Works fine" },
  { value: "slow", label: "Slow loading" },
  { value: "navigation", label: "Hard to navigate" },
  { value: "errors", label: "Errors or crashes" },
] as const;

const PROMPT_OPTIONS = [
  { value: "reminder", label: "Reminder notification" },
  { value: "regular", label: "I use it regularly" },
  { value: "referral", label: "Someone told me about it" },
  { value: "social", label: "Social media" },
  { value: "search", label: "Found it online" },
] as const;

const AWARENESS_OPTIONS = [
  { value: "yes_use", label: "Yes — I already use those" },
  { value: "yes_untried", label: "Yes, but I haven't tried them" },
  { value: "no", label: "No, I didn't know" },
] as const;

type RadioOpt = { value: string; label: string };

function RadioCard({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly RadioOpt[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="space-y-1 pt-1">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-1.5 text-[14px] ${
            value === opt.value
              ? "border-accent bg-accent/10"
              : "border-card-foreground/20 bg-white hover:border-accent/60"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 text-accent focus:ring-accent"
          />
          <span className="text-card-foreground">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function SurveyPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const send = useServerFn(submitSurvey);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const [mostUsed, setMostUsed] = useState("");
  const [ease, setEase] = useState<number | null>(null);
  const [techIssue, setTechIssue] = useState("");
  const [prompt, setPrompt] = useState("");
  const [awareness, setAwareness] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ease) return toast.error("Please rate how easy it is to use.");
    if (!mostUsed) return toast.error("Please pick which part you use most.");
    if (!techIssue) return toast.error("Please tell us if you've had technical issues.");
    if (!prompt) return toast.error("Please tell us what brought you here today.");
    setSubmitting(true);
    try {
      await send({
        data: {
          most_used: mostUsed as (typeof MOST_USED_OPTIONS)[number]["value"],
          ease,
          tech_issue: techIssue as (typeof TECH_OPTIONS)[number]["value"],
          prompt: prompt as (typeof PROMPT_OPTIONS)[number]["value"],
          feature_awareness: awareness
            ? (awareness as (typeof AWARENESS_OPTIONS)[number]["value"])
            : null,
          comment: comment || null,
        },
      });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit survey.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AppShell>
        <Link to="/profile" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Account
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-card-foreground text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-3 font-display text-2xl">Thank you</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Your feedback helps us make this app more useful for everyone.
          </p>
          <Link
            to="/profile"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-semibold text-accent-foreground shadow-soft hover:opacity-90"
          >
            Back to account
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link to="/profile" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="font-display text-3xl text-foreground">Quick survey</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        5 quick questions about how you use the app. Under 1 minute.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Q1 — ease of use */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
          <h2 className="font-display text-base">1. How easy is this app to use?</h2>
          <div className="flex items-center justify-between gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setEase(n)}
                className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-[15px] font-semibold transition ${
                  ease === n
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-card-foreground/20 bg-white text-card-foreground hover:border-accent/60"
                }`}
                aria-pressed={ease === n}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-card-foreground/60">
            <span>Hard to use</span>
            <span>Very easy</span>
          </div>
        </div>

        {/* Q2 */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
          <h2 className="font-display text-base">2. Which part do you use most?</h2>
          <RadioCard options={MOST_USED_OPTIONS} value={mostUsed} onChange={setMostUsed} name="most_used" />
        </div>

        {/* Q3 */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
          <h2 className="font-display text-base">3. Any technical problems?</h2>
          <RadioCard options={TECH_OPTIONS} value={techIssue} onChange={setTechIssue} name="tech_issue" />
        </div>

        {/* Q4 */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
          <h2 className="font-display text-base">4. What brought you here today?</h2>
          <RadioCard options={PROMPT_OPTIONS} value={prompt} onChange={setPrompt} name="prompt" />
        </div>

        {/* Q5 (optional) */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
          <h2 className="font-display text-base">
            5. Did you know Wake Up Wednesday can send you a plan, show local resources, and connect you to help?
          </h2>
          <p className="text-[12px] text-card-foreground/60">Optional</p>
          <RadioCard options={AWARENESS_OPTIONS} value={awareness} onChange={setAwareness} name="awareness" />
        </div>

        {/* Optional comment */}
        <div className="rounded-xl border border-border bg-card p-3 text-card-foreground">
          <label htmlFor="comment" className="mb-1.5 block text-[12px] font-medium text-card-foreground/70">
            Anything else you want us to know? (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground placeholder:text-card-foreground/40 focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-4 py-3 text-[15px] font-semibold text-white shadow-soft transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit"}
        </button>
      </form>
    </AppShell>
  );
}
