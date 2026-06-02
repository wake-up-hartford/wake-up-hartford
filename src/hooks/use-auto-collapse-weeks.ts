import { useEffect, useState } from "react";
import type { StepRow } from "@/lib/plan-types";

export function useAutoCollapseWeeks(steps: StepRow[]) {
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!steps.length) return;
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      let changed = false;
      const byWeek = new Map<number, StepRow[]>();
      for (const s of steps) {
        const arr = byWeek.get(s.week) ?? [];
        arr.push(s);
        byWeek.set(s.week, arr);
      }
      for (const [w, weekSteps] of byWeek) {
        const allDone = weekSteps.length > 0 && weekSteps.every((s) => s.completed_at);
        if (allDone && !next.has(w)) {
          next.add(w);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [steps]);

  const toggleWeekCollapse = (w: number) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w); else next.add(w);
      return next;
    });
  };

  return { collapsedWeeks, toggleWeekCollapse };
}
