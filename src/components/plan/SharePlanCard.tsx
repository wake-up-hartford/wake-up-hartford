import { useRef } from "react";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { useSharePdf } from "@/hooks/use-share-pdf";

type Props = {
  printRef?: React.RefObject<HTMLElement | null>;
  onBeforeCapture?: () => (() => void) | void;
};

export function SharePlanCard({ printRef, onBeforeCapture }: Props) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = "My 30-day stabilization plan";
  const shareText = `I'd like to share my 30-day plan with you so you can help me follow through. View it here: ${shareUrl}`;
  const sms = `sms:?&body=${encodeURIComponent(shareText)}`;
  const { share, loading, error } = useSharePdf();
  const filename = useRef(`Wake-Up-Plan-${shareUrl.split("/").pop()?.split("?")[0] ?? "plan"}.pdf`).current;

  const handleEmail = async () => {
    if (!printRef?.current) return;
    await share(printRef.current, {
      title: shareTitle,
      text: shareText,
      filename,
    }, onBeforeCapture);
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h3 className="mb-1 text-[15px] font-semibold text-card-foreground">Share your plan</h3>
      <p className="mb-3 text-[14px] text-card-foreground">
        Share with a family member, case manager or advocate who can help you follow through.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={sms}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-[13px] font-semibold text-accent-foreground hover:opacity-90"
        >
          <MessageSquare className="h-4 w-4" /> Text
        </a>
        <button
          onClick={handleEmail}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-[13px] font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {loading ? "Preparing PDF…" : "Email"}
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

