import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { submitSurvey } from "@/lib/survey.functions";

export const Route = createFileRoute("/survey")({
  head: () => ({ meta: [{ title: "Quick survey" }] }),
  component: SurveyPage,
});

const PROGRESS_OPTIONS = [
  { value: "better", label: "Better" },
  { value: "same", label: "About the same" },
  { value: "worse", label: "Worse" },
  { value: "too_early", label: "Too early to tell" },
] as const;

const BARRIER_OPTIONS = [
  { value: "housing_money", label: "Housing / money" },
  { value: "health_stress", label: "Health / stress" },
  { value: "time", label: "Time" },
  { value: "next_step", label: "Don't know what step to take next" },
  { value: "on_track", label: "Nothing — I'm on track" },
  { value: "other", label: "Other" },
] as const;

function SurveyPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const send = useServerFn(submitSurvey);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const [helpfulness, setHelpfulness] = useState<number | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [barrier, setBarrier] = useState<string>("");
  const [otherText, setOtherText] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpfulness) return toast.error("Please rate how helpful your plan has been.");
    if (!progress) return toast.error("Please tell us how things are going.");
    if (!barrier) return toast.error("Please pick what's getting in the way most.");
    setSubmitting(true);
    try {
      await send({
        data: {
          helpfulness,
          progress: progress as (typeof PROGRESS_OPTIONS)[number]["value"],
          barrier: barrier as (typeof BARRIER_OPTIONS)[number]["value"],
          other_text: barrier === "other" ? otherText : null,
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
      <p className="mt-2 text-[14px] text-muted-foreground">3 questions. About 30 seconds.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Q1 */}
        <fieldset className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
          <legend className="font-display text-base text-card-foreground">
            1. How helpful has your plan been so far?
          </legend>
          <div className="flex items-center justify-between gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setHelpfulness(n)}
                className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-[15px] font-semibold transition ${
                  helpfulness === n
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-card-foreground/20 bg-white text-card-foreground hover:border-accent/60"
                }`}
                aria-pressed={helpfulness === n}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-card-foreground/60">
            <span>Not helpful</span>
            <span>Very helpful</span>
          </div>
        </fieldset>

        {/* Q2 */}
        <fieldset className="space-y-2 rounded-xl border border-border bg-card p-4 text-card-foreground">
          <legend className="font-display text-base text-card-foreground">
            2. Since starting, how are things going overall?
          </legend>
          <div className="space-y-2 pt-1">
            {PROGRESS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[14px] ${
                  progress === opt.value
                    ? "border-accent bg-accent/10"
                    : "border-card-foreground/20 bg-white hover:border-accent/60"
                }`}
              >
                <input
                  type="radio"
                  name="progress"
                  value={opt.value}
                  checked={progress === opt.value}
                  onChange={(e) => setProgress(e.target.value)}
                  className="h-4 w-4 text-accent focus:ring-accent"
                />
                <span className="text-card-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Q3 */}
        <fieldset className="space-y-2 rounded-xl border border-border bg-card p-4 text-card-foreground">
          <legend className="font-display text-base text-card-foreground">
            3. What's getting in the way most right now?
          </legend>
          <div className="space-y-2 pt-1">
            {BARRIER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[14px] ${
                  barrier === opt.value
                    ? "border-accent bg-accent/10"
                    : "border-card-foreground/20 bg-white hover:border-accent/60"
                }`}
              >
                <input
                  type="radio"
                  name="barrier"
                  value={opt.value}
                  checked={barrier === opt.value}
                  onChange={(e) => setBarrier(e.target.value)}
                  className="h-4 w-4 text-accent focus:ring-accent"
                />
                <span className="text-card-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
          {barrier === "other" && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              maxLength={500}
              placeholder="Tell us more (optional)"
              className="mt-2 w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground placeholder:text-card-foreground/40 focus:border-accent focus:outline-none"
            />
          )}
        </fieldset>

        {/* Optional comment */}
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-[15px] font-semibold text-accent-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit"}
        </button>
      </form>
    </AppShell>
  );
}
