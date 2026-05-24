import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ChevronLeft, HandHeart, Mail, Share2, Phone, ExternalLink, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getTractIndicators, type Indicator } from "@/lib/tract-indicators.functions";
import { draftAdvocacyLetter } from "@/lib/action-letter.functions";
import { VETTED_RESOURCES, INDICATOR_TO_TAGS, type Resource, type ResourceTag } from "@/data/vetted-resources";

const search = z.object({
  state: fallback(z.string().regex(/^\d{2}$/), "09").default("09"),
  county: fallback(z.string().regex(/^\d{3}$/), "003").default("003"),
  tract: fallback(z.string().regex(/^\d{6}$/), "500100").default("500100"),
  name: fallback(z.string(), "").default(""),
  neighborhood: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/neighborhood-actions")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Take Action — Wake Up Wednesday" },
      { name: "description", content: "Three concrete actions you can take based on your neighborhood's data." },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const { state, county, tract, name, neighborhood } = Route.useSearch();
  const tractName = name || tract;
  const tractLabel = neighborhood || `Tract ${tractName}`;

  const fetchIndicators = useServerFn(getTractIndicators);
  const { data, isLoading } = useQuery({
    queryKey: ["tract-indicators", state, county, tract],
    queryFn: () => fetchIndicators({ data: { state, county, tract } }),
    staleTime: 1000 * 60 * 60,
  });

  const indicators = data?.indicators ?? [];

  return (
    <AppShell>
      <div className="mb-4">
        <Link to="/neighborhood" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to report
        </Link>
      </div>

      <SectionHeader
        eyebrow={`Census Tract ${tractName}`}
        title="Take action for your neighborhood"
        subtitle="Three things you can do right now, tailored to what the data shows about this tract."
      />

      <ActionCardFindHelp indicators={indicators} loading={isLoading} />
      <ActionCardEmailRep
        indicators={indicators}
        loading={isLoading}
        tractName={tractName}
        neighborhood={tractLabel}
      />
      <ActionCardShare indicators={indicators} state={state} county={county} tract={tract} name={tractName} neighborhood={tractLabel} />
    </AppShell>
  );
}

// ---------- 1. Find help ----------

function ActionCardFindHelp({ indicators, loading }: { indicators: Indicator[]; loading: boolean }) {
  const prioritized = useMemo(() => prioritizeResources(indicators), [indicators]);

  return (
    <Card className="mb-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
          <HandHeart className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl leading-tight">Get help in your neighborhood</h2>
          <p className="mt-1 text-sm text-foreground/80">
            {loading
              ? "Loading recommendations…"
              : "These organizations are ranked by what this tract needs most. All free or low-cost."}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {prioritized.slice(0, 6).map((r) => (
          <ResourceRow key={r.name} resource={r} />
        ))}
      </div>
    </Card>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="font-semibold text-card-foreground">{resource.name}</p>
      <p className="mt-1 text-sm text-foreground/75">{resource.description}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        {resource.phone && (
          <a href={`tel:${resource.phone.replace(/[^0-9]/g, "")}`} className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200">
            <Phone className="h-3.5 w-3.5" /> {resource.phone}
          </a>
        )}
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:text-amber-200">
            <ExternalLink className="h-3.5 w-3.5" /> Website
          </a>
        )}
      </div>
    </div>
  );
}

function prioritizeResources(indicators: Indicator[]): Resource[] {
  const weight: Record<string, number> = {};
  for (const ind of indicators) {
    const tags = INDICATOR_TO_TAGS[ind.key];
    if (!tags) continue;
    const w = ind.severity === "concern" ? 3 : ind.severity === "watch" ? 1 : 0;
    for (const t of tags) weight[t] = (weight[t] ?? 0) + w;
  }
  return [...VETTED_RESOURCES].sort((a, b) => {
    const sa = a.tags.reduce((acc, t) => acc + (weight[t] ?? 0), 0);
    const sb = b.tags.reduce((acc, t) => acc + (weight[t] ?? 0), 0);
    return sb - sa;
  });
}

// ---------- 2. Email rep ----------

function ActionCardEmailRep({
  indicators,
  loading,
  tractName,
  neighborhood,
}: {
  indicators: Indicator[];
  loading: boolean;
  tractName: string;
  neighborhood: string;
}) {
  const [tone, setTone] = useState<"urgent" | "constructive" | "personal">("constructive");
  const [audience, setAudience] = useState<"state_rep" | "council">("state_rep");
  const [letter, setLetter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const draft = useServerFn(draftAdvocacyLetter);
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tractName,
        neighborhood,
        audience,
        tone,
        senderName: "",
        indicators: indicators.map((i) => ({
          key: i.key,
          label: i.label,
          value: i.value,
          severity: i.severity,
          note: i.note ?? "",
          stateAverage: i.stateAverage ? { value: i.stateAverage.value, label: i.stateAverage.label } : null,
        })),
      };
      return draft({ data: payload });
    },
    onSuccess: (res) => {
      if (res.letter) {
        setLetter(res.letter);
        setError(null);
      } else {
        setError(res.error ?? "Could not generate letter.");
      }
    },
  });

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mailto = `mailto:?subject=${encodeURIComponent(`Conditions in Census Tract ${tractName}`)}&body=${encodeURIComponent(letter)}`;

  return (
    <Card className="mb-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500/20 text-sky-300">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl leading-tight">Tell your representative</h2>
          <p className="mt-1 text-sm text-foreground/80">
            Draft an email that cites the real numbers from this tract. Pick a tone, then edit before sending.
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <SegmentedField
          label="To"
          value={audience}
          onChange={(v) => setAudience(v as "state_rep" | "council")}
          options={[
            { value: "state_rep", label: "State Rep" },
            { value: "council", label: "Council" },
          ]}
        />
        <SegmentedField
          label="Tone"
          value={tone}
          onChange={(v) => setTone(v as "urgent" | "constructive" | "personal")}
          options={[
            { value: "urgent", label: "Urgent" },
            { value: "constructive", label: "Constructive" },
            { value: "personal", label: "Personal" },
          ]}
        />
      </div>

      <Button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={loading || mutation.isPending || indicators.length === 0}
        className="w-full"
      >
        {mutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting…</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" /> {letter ? "Regenerate draft" : "Draft my email"}</>
        )}
      </Button>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {letter && (
        <div className="mt-4">
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-border bg-card/80 p-3 text-sm leading-relaxed text-card-foreground"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</>}
            </Button>
            <a href={mailto}>
              <Button type="button" size="sm">
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Open in email app
              </Button>
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            We can't auto-look up your specific rep yet — find yours at{" "}
            <a href="https://www.cga.ct.gov/asp/menu/cgafindleg.asp" target="_blank" rel="noreferrer" className="text-gold underline">cga.ct.gov</a>.
          </p>
        </div>
      )}
    </Card>
  );
}

function SegmentedField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex rounded-lg bg-secondary/60 p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
              value === o.value ? "bg-card text-card-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- 3. Share ----------

function ActionCardShare({
  indicators,
  state,
  county,
  tract,
  name,
  neighborhood,
}: {
  indicators: Indicator[];
  state: string;
  county: string;
  tract: string;
  name: string;
  neighborhood: string;
}) {
  const [copied, setCopied] = useState(false);

  const topConcerns = indicators
    .filter((i) => i.severity === "concern")
    .slice(0, 3)
    .map((i) => `${i.label.toLowerCase()} ${i.value}`)
    .join(", ");

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/neighborhood-actions?state=${state}&county=${county}&tract=${tract}&name=${encodeURIComponent(name)}&neighborhood=${encodeURIComponent(neighborhood)}`
    : "";

  const summary = topConcerns
    ? `${neighborhood} (Tract ${name}): ${topConcerns}. See the full neighborhood report: ${shareUrl}`
    : `${neighborhood} (Tract ${name}) — see the full neighborhood report: ${shareUrl}`;

  const councilDraft = `Dear Council Member,

I'm writing about ${neighborhood} (Census Tract ${name}). The data shows ${topConcerns || "concerning conditions"}. I'd like to know what the city is doing about it and how residents can be part of the solution.

Full report: ${shareUrl}

Thank you,
[Your name]`;

  const share = async (text: string) => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ text });
        return;
      } catch {/* user cancelled */}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="mb-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/25 text-gold">
          <Share2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl leading-tight">Share this report</h2>
          <p className="mt-1 text-sm text-foreground/80">
            Send the numbers to a neighbor, a council member, or a reporter.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick share</p>
          <p className="rounded-xl border border-border bg-card/60 p-3 text-sm text-card-foreground">{summary}</p>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => share(summary)}>
            {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied</> : <><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share</>}
          </Button>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Share to a council member</p>
          <textarea
            defaultValue={councilDraft}
            rows={8}
            className="w-full rounded-xl border border-border bg-card/80 p-3 text-sm leading-relaxed text-card-foreground"
            onChange={() => { /* user edits locally */ }}
          />
          <a
            href={`mailto:?subject=${encodeURIComponent(`Conditions in Census Tract ${name}`)}&body=${encodeURIComponent(councilDraft)}`}
            className="mt-2 inline-block"
          >
            <Button type="button" size="sm">
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Open in email
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
