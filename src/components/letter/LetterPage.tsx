import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Printer, Copy, Mail } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

/** Shared input styling used across all letter forms. */
export const letterInputClass =
  "w-full rounded-full border-[1.5px] border-pop-border bg-step-resource px-4 py-2.5 text-step-resource-foreground placeholder:text-step-resource-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-[14px]";

/** Labeled form field wrapper used inside letter forms. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

type LetterPageProps = {
  /** Route path for the back link. */
  backTo: string;
  /** Visible label for the back link, e.g. "Back to Your Home". */
  backLabel: string;
  /** Small eyebrow above the title, e.g. "Tenant tools". */
  eyebrow: string;
  /** Page H1. */
  title: string;
  /** Intro paragraph under the title. */
  intro: ReactNode;
  /** Form cards (inputs). Rendered above the preview. */
  children: ReactNode;
  /** Generated letter text. */
  letter: string;
  /** Subject line used by the Email button. */
  emailSubject: string;
  /** Footer disclaimer / source attribution. */
  disclaimer: ReactNode;
  /** Optional search params for the back link. */
  backSearch?: Record<string, string>;
};

/**
 * Shared scaffold for tenant-letter pages: back link, header, form slot,
 * preview, print/email/copy actions, and disclaimer. Pages only need to
 * supply their form fields and the generated letter string.
 */
export function LetterPage({
  backTo,
  backLabel,
  eyebrow,
  title,
  intro,
  children,
  letter,
  emailSubject,
  disclaimer,
  backSearch,
}: LetterPageProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handlePrint = () => window.print();

  const handleEmail = () => {
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(letter);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <AppShell>
      <Link
        to={backTo}
        search={backSearch as never}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ChevronLeft className="h-4 w-4" /> {backLabel}
      </Link>

      <header className="mb-6 print:hidden">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-extrabold uppercase leading-tight text-foreground">{title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{intro}</p>
      </header>

      {children}

      <Card className="mb-5">
        <div className="mb-3 flex items-center justify-between print:hidden">
          <h2 className="font-display text-lg">Your letter</h2>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Preview
          </span>
        </div>
        <pre className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed text-foreground">
{letter}
        </pre>
      </Card>

      <pre id="print-letter" className="hidden">{letter}</pre>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 print:hidden">
        <Button onClick={handlePrint} size="lg" className="pop-btn w-full rounded-full bg-pink font-bold text-primary-foreground hover:bg-pink/90">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button onClick={handleEmail} size="lg" variant="secondary" className="pop-btn w-full rounded-full bg-card text-card-foreground hover:bg-gold/30">
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button onClick={handleCopy} size="lg" variant="secondary" className="pop-btn w-full rounded-full bg-card text-card-foreground hover:bg-gold/30">
          <Copy className="h-4 w-4" />
          {copyStatus === "copied"
            ? "Copied!"
            : copyStatus === "error"
              ? "Couldn't copy"
              : "Copy text"}
        </Button>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground print:hidden">
        {disclaimer}
      </p>
    </AppShell>
  );
}
