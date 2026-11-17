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

const TECH_OPTIONS = [
  { value: "none", label: "No problems" },
  { value: "slow", label: "Slow loading" },
  { value: "navigation", label: "Hard to navigate" },
  { value: "errors", label: "Errors or crashes" },
] as const;

const PROMPT_OPTIONS = [
  { value: "referral", label: "Someone told me" },
  { value: "qr", label: "QR code" },
  { value: "social", label: "Social media" },
  { value: "reminder", label: "Notification" },
  { value: "other", label: "Other" },
] as const;

const FEATURE_OPTIONS = [
  { value: "plan", label: "Got an AI-generated plan" },
  { value: "address", label: "Looked up a Hartford address" },
  { value: "neighborhood", label: "Read about my neighborhood" },
  { value: "resource", label: "Found a local resource" },
  { value: "none", label: "None yet" },
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

function CheckboxCard({
  options,
  values,
  onToggle,
}: {
  options: readonly RadioOpt[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-1 pt-1">
      {options.map((opt) => {
        const checked = values.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-1.5 text-[14px] ${
              checked
                ? "border-accent bg-accent/10"
                : "border-card-foreground/20 bg-white hover:border-accent/60"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt.value)}
              className="h-4 w-4 text-accent focus:ring-accent"
            />
            <span className="text-card-foreground">{opt.label}</span>
          </label>
        );
      })}
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

  const [ease, setEase] = useState<number | null>(null);
  const [techIssue, setTechIssue] = useState("");
  const [prompt, setPrompt] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleFeature = (v: string) => {
    setFeatures((prev) => {
      if (v === "none") return prev.includes("none") ? [] : ["none"];
      const without = prev.filter((p) => p !== "none");
      return without.includes(v) ? without.filter((p) => p !== v) : [...without, v];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ease) return toast.error("Please rate how easy it is to use.");
    if (!techIssue) return toast.error("Please tell us if you've had technical issues.");
    if (!prompt) return toast.error("Please tell us how you first heard about the app.");
    setSubmitting(true);
    try {
      await send({
        data: {
          ease,
          tech_issue: techIssue as (typeof TECH_OPTIONS)[number]["value"],
          prompt: prompt as (typeof PROMPT_OPTIONS)[number]["value"],
          features_used: features as (typeof FEATURE_OPTIONS)[number]["value"][],
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
        <div className="mt-8 pop-card pop-pink rounded-2xl bg-card p-6 text-card-foreground text-center">
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

  const answered = [ease !== null, !!techIssue, !!prompt, features.length > 0].filter(Boolean).length;
  const pct = Math.round((answered / 4) * 100);

  return (
    <AppShell>
      <Link to="/profile" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Account
      </Link>
      <h1 className="font-display text-3xl text-foreground">Quick survey</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        4 questions, under 1 minute. Your feedback shapes this app.
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-muted-foreground">
          <span>{answered} of 4 answered</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>


      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Q1 */}
        <div className="space-y-3 pop-card pop-cyan rounded-2xl bg-card p-4 text-card-foreground">
          <h2 className="font-display text-base">1. How easy is this app to use?</h2>
          <div className="flex justify-between text-[11px] text-card-foreground/60">
            <span>Very hard</span>
            <span>Very easy</span>
          </div>
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
        </div>

        {/* Q2 */}
        <div className="space-y-2 pop-card pop-cyan rounded-2xl bg-card p-4 text-card-foreground">
          <h2 className="font-display text-base">2. Did you run into any technical problems?</h2>
          <RadioCard options={TECH_OPTIONS} value={techIssue} onChange={setTechIssue} name="tech_issue" />
        </div>

        {/* Q3 */}
        <div className="space-y-2 pop-card pop-cyan rounded-2xl bg-card p-4 text-card-foreground">
          <h2 className="font-display text-base">3. How did you first hear about this app?</h2>
          <RadioCard options={PROMPT_OPTIONS} value={prompt} onChange={setPrompt} name="prompt" />
        </div>

        {/* Q4 */}
        <div className="space-y-2 pop-card pop-cyan rounded-2xl bg-card p-4 text-card-foreground">
          <h2 className="font-display text-base">4. Which of these have you used? (check all that apply)</h2>
          <CheckboxCard options={FEATURE_OPTIONS} values={features} onToggle={toggleFeature} />
        </div>

        {/* Optional comment */}
        <div className="pop-card pop-cyan rounded-2xl bg-card p-4 text-card-foreground">
          <label htmlFor="comment" className="mb-1.5 block text-[12px] font-medium text-card-foreground/70">
            Anything else? (optional)
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
          className="pop-btn flex w-full items-center justify-center gap-2 rounded-full bg-pink px-5 py-3 font-display text-[15px] font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60 transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit"}
        </button>
      </form>
    </AppShell>
  );
}
