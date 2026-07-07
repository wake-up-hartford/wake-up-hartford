import { Link } from "@tanstack/react-router";
import { Printer, User } from "lucide-react";

type Props = {
  isAnonymous?: boolean;
};

export function PlanFooterActions({ isAnonymous }: Props) {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white"
      >
        <Printer className="h-4 w-4" /> Print this plan
      </button>

      {!isAnonymous && (
        <Link
          to="/profile"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white"
        >
          <User className="h-4 w-4" /> Go to my Profile and Plans
        </Link>
      )}
    </>
  );
}
