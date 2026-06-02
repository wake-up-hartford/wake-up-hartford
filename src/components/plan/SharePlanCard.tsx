import { Copy, Mail, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";

export function SharePlanCard() {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = "My 30-day stabilization plan";
  const shareText = `I'd like to share my 30-day plan with you so you can help me follow through. View it here: ${shareUrl}`;
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast("Link copied — paste it to share");
      } catch {
        toast("Couldn't copy link");
      }
    }
  };
  const mailto = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText)}`;
  const sms = `sms:?&body=${encodeURIComponent(shareText)}`;
  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-accent" />
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground">Share this plan</h3>
      </div>
      <p className="mb-3 text-[14px] text-foreground">
        Share your Plan with a family member, case manager or advocate who can help you follow through.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={sms}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold text-card-foreground hover:bg-secondary/50"
        >
          <MessageSquare className="h-4 w-4" /> Text
        </a>
        <a
          href={mailto}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold text-card-foreground hover:bg-secondary/50"
        >
          <Mail className="h-4 w-4" /> Email
        </a>
        <button
          onClick={handleNativeShare}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-[13px] font-semibold text-accent-foreground hover:opacity-90"
        >
          {hasNativeShare ? (
            <><Share2 className="h-4 w-4" /> Share…</>
          ) : (
            <><Copy className="h-4 w-4" /> Copy link</>
          )}
        </button>
      </div>
    </div>
  );
}
