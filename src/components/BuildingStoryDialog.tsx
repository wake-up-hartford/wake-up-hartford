import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Copy, Check, LogIn } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { generateBuildingStory } from "@/lib/building-story.functions";
import type { AddressLookup } from "@/lib/mock-data";


export function BuildingStoryDialog({ data }: { data: AddressLookup }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language] = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const generate = useServerFn(generateBuildingStory);

  const mutation = useMutation({
    mutationFn: () =>
      generate({
        data: {
          address: data.address,
          neighborhood: data.neighborhood,
          yearBuilt: data.yearBuilt,
          units: data.units,
          landlord: data.landlord,
          language,
          building: {
            openCodeViolations: data.building.codeViolations.open,
            closedCodeViolations12mo: data.building.codeViolations.closed12mo,
            recentViolations: data.building.codeViolations.recent.map(
              (v) => `${v.description} (${v.status})`,
            ),
            evictions12mo: data.building.evictions.filings12mo,
            evictionRate: data.building.evictions.rate,
            utilityShutoffs12mo: data.building.utilityShutoffs.count12mo,
            complaints311_12mo: data.building.complaints311.count12mo,
            topComplaintCategory: data.building.complaints311.topCategory,
          },
          landlordPortfolio: {
            propertiesInHartford: data.landlordPortfolio.propertiesInHartford,
            totalUnits: data.landlordPortfolio.totalUnits,
            totalOpenCodeViolations: data.landlordPortfolio.totalOpenCodeViolations,
            totalEvictions12mo: data.landlordPortfolio.totalEvictions12mo,
            totalComplaints311_12mo: data.landlordPortfolio.totalComplaints311_12mo,
          },
        },
      }),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && user && !mutation.data && !mutation.isPending) mutation.mutate();
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
          <DialogTitle className="font-display text-xl">{data.address}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            An AI-written story, grounded in the records for this building and its owner.
          </p>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <LanguageToggle />
          {mutation.data?.story && (
            <ListenButton
              text={mutation.data.story}
              cacheKey={`building:${data.address}:${language}`}
              language={language}
            />
          )}
        </div>

        <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1 py-2">
          {authLoading && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading…</p>
            </div>
          )}

          {!authLoading && !user && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sign in to generate an AI-written story for this building.
              </p>
              <Button asChild size="sm">
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to generate
                </Link>
              </Button>
            </div>
          )}

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
