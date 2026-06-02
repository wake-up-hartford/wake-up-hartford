import { Link } from "@tanstack/react-router";
import { Bookmark, Printer } from "lucide-react";

type Props = {
  bookmarkCount: number;
};

export function PlanFooterActions({ bookmarkCount }: Props) {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground hover:bg-secondary/50"
      >
        <Printer className="h-4 w-4" /> Print this plan
      </button>

      {bookmarkCount > 0 && (
        <Link
          to="/plans"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gold bg-gold/10 px-5 py-3 text-[14px] font-semibold text-gold hover:bg-gold/20"
        >
          <Bookmark className="h-4 w-4 fill-current" />
          {bookmarkCount} saved plan{bookmarkCount === 1 ? "" : "s"} — view all
        </Link>
      )}
    </>
  );
}
