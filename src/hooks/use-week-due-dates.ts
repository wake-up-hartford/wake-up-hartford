import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useWeekDueDates(planId: string) {
  const DUE_DATES_KEY = `planDueDates:${planId}`;
  const [dueOverrides, setDueOverrides] = useState<Record<number, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const overrides = JSON.parse(localStorage.getItem(DUE_DATES_KEY) ?? "{}") as Record<number, string>;
      setDueOverrides(overrides);
    } catch { /* ignore */ }
  }, [DUE_DATES_KEY]);

  const setWeekDueDate = (week: number, isoDate: string | null) => {
    setDueOverrides((prev) => {
      const next = { ...prev };
      if (isoDate) next[week] = isoDate;
      else delete next[week];
      try { localStorage.setItem(DUE_DATES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    toast(isoDate ? "Due date updated" : "Due date reset");
  };

  const getWeekDueDate = (week: number, generatedAt: string | null) => {
    const defaultDue = generatedAt
      ? new Date(new Date(generatedAt).getTime() + week * 7 * 24 * 60 * 60 * 1000)
      : null;
    const overrideIso = dueOverrides[week];
    const dueDate = overrideIso ? new Date(overrideIso + "T00:00:00") : defaultDue;
    return { dueDate, isCustom: !!overrideIso };
  };

  return { dueOverrides, setWeekDueDate, getWeekDueDate };
}
