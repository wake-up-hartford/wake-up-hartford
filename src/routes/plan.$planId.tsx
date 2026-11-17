import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CrisisFlags } from "@/components/plan/CrisisFlags";
import { PlanFooterActions } from "@/components/plan/PlanFooterActions";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { SharePlanCard } from "@/components/plan/SharePlanCard";
import { WeekCard } from "@/components/plan/WeekCard";
import { useAuth } from "@/hooks/use-auth";
import { useAutoCollapseWeeks } from "@/hooks/use-auto-collapse-weeks";

import { useWeekDueDates } from "@/hooks/use-week-due-dates";
import { getPlan, toggleStep } from "@/lib/stabilization-plan.functions";
import type { PlanShape, StepRow } from "@/lib/plan-types";

export const Route = createFileRoute("/plan/$planId")({
  head: () => ({
    meta: [
      { title: "Your 30-Day Plan — Wake Up Wednesday" },
      { name: "description", content: "Your personalized 30-day stabilization plan with step-by-step actions." },
      { property: "og:title", content: "Your 30-Day Plan — Wake Up Wednesday" },
      { property: "og:description", content: "Your personalized 30-day stabilization plan with step-by-step actions." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/plan" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/plan" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { planId } = Route.useParams();
  const { user, loading, isAnonymous } = useAuth({ ensureAnonymous: true });
  const fetchPlan = useServerFn(getPlan);
  const qc = useQueryClient();
  const toggleFn = useServerFn(toggleStep);

  const { setWeekDueDate, getWeekDueDate } = useWeekDueDates(planId);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const before = () => setIsPrinting(true);
    const after = () => setIsPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);


  const { data, isLoading, error } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlan({ data: { planId } }),
    enabled: !!user,
  });

  const mut = useMutation({
    mutationFn: (vars: { stepId: string; done: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan", planId] }),
  });

  const plan = (data?.plan?.plan ?? null) as PlanShape | null;
  const generatedAt = (data?.plan?.generated_at ?? null) as string | null;
  const steps = (data?.steps ?? []) as StepRow[];
  const { collapsedWeeks, toggleWeekCollapse } = useAutoCollapseWeeks(steps);

  if (loading || isLoading) {
    return <AppShell><p className="text-muted-foreground">Loading your plan…</p></AppShell>;
  }
  if (error || !data || !plan) {
    return (
      <AppShell>
        <p className="text-destructive mb-3">
          {(error as Error)?.message ?? "Couldn't load this plan."}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          If this plan is on your account, sign in to view it.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center justify-center pop-btn rounded-full bg-pink px-5 py-3 font-display text-[14px] font-bold uppercase tracking-wide text-primary-foreground"
        >
          Sign in
        </Link>
      </AppShell>
    );
  }

  const stepsByWeek = new Map<number, StepRow[]>();
  for (const s of steps) {
    const arr = stepsByWeek.get(s.week) ?? [];
    arr.push(s);
    stepsByWeek.set(s.week, arr);
  }
  const total = steps.length;
  const done = steps.filter((s) => s.completed_at).length;

  const handleToggleStep = (stepId: string, isDone: boolean) => {
    mut.mutate({ stepId, done: isDone });
  };

  return (
    <AppShell>
      <div id="print-plan">

      <Link to="/plans" className="no-print mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      <PlanHeader
        user={user}
        generatedAt={generatedAt}
        prioritySummary={plan.priority_summary}
        done={done}
        total={total}
      />

      <CrisisFlags flags={plan.crisis_flags ?? []} />

      <div className="space-y-4">
        {[1, 2, 3, 4].map((w) => {
          const weekMeta = plan.weeks.find((x) => x.week === w);
          const ws = stepsByWeek.get(w) ?? [];
          const { dueDate, isCustom } = getWeekDueDate(w, generatedAt);
          return (
            <WeekCard
              key={w}
              week={w}
              focus={weekMeta?.focus}
              steps={ws}
              dueDate={dueDate}
              isCustom={isCustom}
              isCollapsed={!isPrinting && collapsedWeeks.has(w)}
              isEditing={editingWeek === w}
              onToggleCollapse={toggleWeekCollapse}
              onStartEdit={(week) => setEditingWeek(editingWeek === week ? null : week)}
              onCloseEdit={() => setEditingWeek(null)}
              onChangeDueDate={setWeekDueDate}
              onToggleStep={handleToggleStep}
            />
          );
        })}
      </div>

      {isAnonymous && (
        <div className="no-print">
          <Link
            id="save-plan-section"
            to="/auth"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.setItem("wuw:postAuthRedirect", `/plan/${planId}`);
                window.localStorage.setItem("wuw:authIntent", "save");
              }
            }}
            className="mt-6 flex w-full items-center justify-center pop-btn rounded-full bg-pink px-5 py-3 font-display text-[14px] font-bold uppercase tracking-wide text-primary-foreground"
          >
            Sign in to return to this plan
          </Link>
          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            Create an account so you can return to track your progress.
          </p>
        </div>
      )}

      <div className="no-print">
        <SharePlanCard
          planData={{
            plan,
            steps,
            generatedAt,
          }}
        />
        <PlanFooterActions isAnonymous={isAnonymous} />
      </div>

      </div>
    </AppShell>
  );
}

