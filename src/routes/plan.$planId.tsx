import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { useBookmarkPlan } from "@/hooks/use-bookmark-plan";
import { useWeekDueDates } from "@/hooks/use-week-due-dates";
import { getPlan, toggleStep } from "@/lib/stabilization-plan.functions";
import type { PlanShape, StepRow } from "@/lib/plan-types";

export const Route = createFileRoute("/plan/$planId")({
  head: () => ({ meta: [{ title: "Your 30-day plan" }] }),
  component: PlanPage,
});

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

  const { isBookmarked, bookmarkCount, toggleBookmark } = useBookmarkPlan(planId);
  const { setWeekDueDate, getWeekDueDate } = useWeekDueDates(planId);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);

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
    return <AppShell><p className="text-destructive">{(error as Error)?.message ?? "Couldn't load plan."}</p></AppShell>;
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
      <Link to="/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      <PlanHeader
        user={user}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
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
              isCollapsed={collapsedWeeks.has(w)}
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

      {!user && (
        <Link
          to="/auth"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
        >
          Sign In to receive plan via text/email
        </Link>
      )}

      <SharePlanCard />
      <PlanFooterActions bookmarkCount={bookmarkCount} />
    </AppShell>
  );
}
