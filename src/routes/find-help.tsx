import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ChevronLeft, Phone, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Card, SectionHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { VETTED_RESOURCES, type Resource, type ResourceTag } from "@/data/vetted-resources";

const search = z.object({
  state: fallback(z.string().regex(/^\d{2}$/), "09").default("09"),
  county: fallback(z.string().regex(/^\d{3}$/), "003").default("003"),
  tract: fallback(z.string().regex(/^\d{6}$/), "500100").default("500100"),
  name: fallback(z.string(), "").default(""),
  neighborhood: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/find-help")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Find Help — Wake Up Wednesday" },
      {
        name: "description",
        content:
          "Tell us what you need and we'll show vetted Connecticut organizations that can help.",
      },
    ],
  }),
  component: FindHelpPage,
});

type NeedOption = {
  id: ResourceTag;
  label: string;
  hint: string;
};

const NEEDS: NeedOption[] = [
  { id: "housing", label: "Housing / eviction", hint: "Landlord problems, eviction notice, unsafe unit, homelessness" },
  { id: "rent", label: "Help paying rent", hint: "Behind on rent or utilities, need emergency assistance" },
  { id: "food", label: "Food", hint: "Food pantry, free meals, help signing up for SNAP" },
  { id: "health", label: "Health care", hint: "Need a doctor, dentist, or behavioral health support" },
  { id: "uninsured", label: "Health insurance", hint: "Uninsured or need help enrolling in coverage" },
  { id: "jobs", label: "Work / job training", hint: "Looking for a job, training, or unemployment help" },
  { id: "income", label: "Income / benefits", hint: "Tax credits, benefits enrollment, financial help" },
  { id: "education", label: "Education / GED / ESL", hint: "Finish high school, learn English, college prep" },
  { id: "youth", label: "Kids & youth", hint: "Support for children, students, and young adults" },
  { id: "legal", label: "Legal help", hint: "Free civil legal aid — housing, benefits, family" },
  { id: "civic", label: "Civic / voting / city issues", hint: "Voter registration, report blight, organize neighbors" },
];

function FindHelpPage() {
  const { state, county, tract, name, neighborhood } = Route.useSearch();
  const tractName = name || tract;
  const tractLabel = neighborhood || `Tract ${tractName}`;
  const [selected, setSelected] = useState<Set<ResourceTag>>(new Set());

  const toggle = (id: ResourceTag) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const grouped = useMemo(() => groupResources(VETTED_RESOURCES, selected), [selected]);
  const matches = useMemo(() => grouped.flatMap((g) => g.resources), [grouped]);
  const hasSelection = selected.size > 0;

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/neighborhood-actions"
          search={{ state, county, tract, name, neighborhood }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to actions
        </Link>
      </div>

      <SectionHeader
        eyebrow={tractLabel}
        title="Find help near you"
        subtitle="Check what you need. We'll show vetted Connecticut organizations that can help — all free or low-cost."
      />

      <Card className="mb-5">
        <p className="mb-3 uppercase tracking-[0.18em] text-gold font-bold text-sm">
          What do you need help with?
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {NEEDS.map((n) => {
            const on = selected.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n.id)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  on
                    ? "border-emerald-400/60 bg-emerald-500/10"
                    : "border-border bg-card/60 hover:border-foreground/30"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    on ? "border-emerald-400 bg-emerald-400 text-emerald-950" : "border-border/40 bg-background/40"
                  }`}
                  aria-hidden
                >
                  {on && (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-card-foreground">{n.label}</span>
                  <span className="block text-xs text-muted-foreground">{n.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </Card>

      {hasSelection ? (
        <>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {matches.length} {matches.length === 1 ? "organization" : "organizations"} can help you
          </h3>
          <div className="space-y-2.5">
            {matches.map((r) => (
              <ResourceRow key={r.name} resource={r} />
            ))}
            {matches.length === 0 && (
              <Card>
                <p className="text-sm text-muted-foreground">
                  No exact matches. Try selecting fewer needs, or call 2-1-1 — Connecticut's free 24/7 referral line.
                </p>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Pick at least one need above</p>
              <p className="mt-1 text-sm text-muted-foreground">
                In a hurry? Call <a href="tel:211" className="text-emerald-300 underline">2-1-1</a> — Connecticut's free 24/7 referral line.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6">
        <Link
          to="/neighborhood-actions"
          search={{ state, county, tract, name, neighborhood }}
        >
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-1.5 h-3.5 w-3.5" /> Back to all actions
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}

function filterResources(all: Resource[], selected: Set<ResourceTag>): Resource[] {
  if (selected.size === 0) return [];
  return all
    .map((r) => {
      const overlap = r.tags.filter((t) => selected.has(t)).length;
      return { r, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .map(({ r }) => r);
}

function ResourceRow({ resource }: { resource: Resource }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <p className="font-semibold text-card-foreground">{resource.name}</p>
      <p className="mt-1 text-sm text-foreground">{resource.description}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#ed9954]">
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/[^0-9]/g, "")}`}
            className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200"
          >
            <Phone className="h-3.5 w-3.5" /> {resource.phone}
          </a>
        )}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-gold hover:text-amber-200"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Website
          </a>
        )}
      </div>
    </div>
  );
}
