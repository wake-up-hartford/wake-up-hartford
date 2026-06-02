import { Mail, MessageSquare } from "lucide-react";

export function SharePlanCard() {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = "My 30-day stabilization plan";
  const shareText = `I'd like to share my 30-day plan with you so you can help me follow through. View it here: ${shareUrl}`;
  const mailto = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`;
  const sms = `sms:?&body=${encodeURIComponent(shareText)}`;

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
        <a
          href={mailto}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-[13px] font-semibold text-accent-foreground hover:opacity-90"
        >
          <Mail className="h-4 w-4" /> Email
        </a>
      </div>
    </div>
  );
}
