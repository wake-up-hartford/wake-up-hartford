import { useEffect, useState } from "react";
import { toast } from "sonner";

const BOOKMARK_KEY = "bookmarkedPlans";

export function useBookmarkPlan(planId: string) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "[]") as string[];
      setIsBookmarked(list.includes(planId));
      setBookmarkCount(list.length);
    } catch { /* ignore */ }
  }, [planId]);

  const toggleBookmark = () => {
    try {
      const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "[]") as string[];
      const willRemove = list.includes(planId);
      const next = willRemove ? list.filter((id) => id !== planId) : [...list, planId];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      setIsBookmarked(next.includes(planId));
      setBookmarkCount(next.length);
      toast(willRemove ? "Removed from saved plans" : "Plan saved");
    } catch { /* ignore */ }
  };

  return { isBookmarked, bookmarkCount, toggleBookmark };
}
