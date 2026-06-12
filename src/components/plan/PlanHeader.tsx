import { Link } from "@tanstack/react-router";
import { Bookmark, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { User } from "@supabase/supabase-js";

type Props = {
  user: User | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  generatedAt: string | null;
  prioritySummary: string;
  done: number;
  total: number;
};

export function PlanHeader({
  user,
  isBookmarked,
  onToggleBookmark,
  generatedAt,
  prioritySummary,
  done,
  total,
}: Props) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl leading-tight text-foreground">Your 30-Day Plan</h1>
        <button
          onClick={onToggleBookmark}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this plan"}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
            isBookmarked
              ? "border-gold bg-gold/10 text-gold"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
          {isBookmarked ? "Saved" : "Save"}
        </button>
      </div>
      {generatedAt && (
        <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-gold">
          <Calendar className="h-3 w-3" />
          Created on {new Date(generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      )}
      {!user && (
        <Link
          to="/auth"
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
        >
          Sign In to receive plan via text/email
        </Link>
      )}
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        {user && (
          <span className="font-semibold text-foreground">
            {(() => {
              const raw = (user.user_metadata?.first_name as string) || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Friend";
              return raw.split(/\s+/)[0];
            })()},{" "}
          </span>
        )}
        {prioritySummary.charAt(0).toLowerCase() + prioritySummary.slice(1)}
      </p>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-emerald-600">{done} of {total} steps completed</span>
          <span className="text-[12px] font-semibold text-emerald-600">{total ? Math.round((done / total) * 100) : 0}%</span>
        </div>
        <Progress value={total ? (done / total) * 100 : 0} className="h-2.5 bg-emerald-100 [&>[role=progressbar]]:bg-emerald-500" />
      </div>
    </div>
  );
}
