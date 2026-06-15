import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListenButton } from "@/components/ListenButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language";

import { generateBuildingStory } from "@/lib/building-story.functions";
import type { LookupResult } from "@/lib/address-lookup.functions";

type Found = Extract<LookupResult, { status: "found" }>;

export function BuildingStoryDialog({ data }: { data: Found }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language] = useLanguage();

  const generate = useServerFn(generateBuildingStory);

  const mutation = useMutation({
    mutationFn: () =>
      generate({
        data: {
          address: data.address.display,
          landlord: data.address.owner,
          language,
          building: {
            openCodeViolations: data.counts.violationsOpen,
            closedCodeViolations12mo: data.counts.violationsClosed12mo,
            recentViolations: data.recentViolations.map(
              (v) => `${v.description} (${v.status})`,
            ),
            complaints311_12mo: data.counts.complaints12mo,
            topComplaintCategory: data.counts.topComplaintType,
          },
          landlordPortfolio: data.portfolio
            ? {
                propertiesInHartford: data.portfolio.propertiesInHartford,
                totalOpenCodeViolations: data.portfolio.totalOpenViolations,
                totalComplaints311_12mo: data.portfolio.totalComplaints12mo,
              }
            : null,
        },
      }),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !mutation.data && !mutation.isPending) mutation.mutate();
    if (!next) setCopied(false);
  };

  // Re-generate when language changes while dialog is open.
  useEffect(() => {
    if (open) {
      mutation.reset();
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleCopy = async () => {
    if (!mutation.data?.story) return;
    await navigator.clipboard.writeText(mutation.data.story);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
        >
          <Sparkles className="h-4 w-4" />
          Read the story of this building
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{data.address.display}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            An AI-written story, grounded in the records for this building and its owner.
          </p>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <LanguageToggle />
          {mutation.data?.story && (
            <ListenButton
              text={mutation.data.story}
              cacheKey={`building:${data.address.normalized}:${language}`}
              language={language}
            />
          )}
        </div>

        <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1 py-2">

          {mutation.isPending && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Writing the story…</p>
            </div>
          )}

          {mutation.isError && (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-destructive">Couldn't generate the story.</p>
              <Button size="sm" variant="outline" onClick={() => mutation.mutate()}>
                Try again
              </Button>
            </div>
          )}

          {mutation.data?.error && (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-destructive">{mutation.data.error}</p>
              <Button size="sm" variant="outline" onClick={() => mutation.mutate()}>
                Try again
              </Button>
            </div>
          )}

          {mutation.data?.story && (
            <div className="space-y-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {mutation.data.story.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>

        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          AI-generated from city housing, court, utility, and 311 records (demo data in this preview). May contain errors — verify before citing.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          {mutation.data?.story && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
