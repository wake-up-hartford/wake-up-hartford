import { useState } from "react";
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
import { generateTractStory } from "@/lib/tract-story.functions";
import type { Indicator } from "@/lib/tract-indicators.functions";

type Props = {
  tractName: string;
  neighborhood: string;
  indicators: Indicator[];
  stateFips?: string;
};

export function TractStoryDialog({ tractName, neighborhood, indicators, stateFips }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const generate = useServerFn(generateTractStory);

  const mutation = useMutation({
    mutationFn: () =>
      generate({
        data: {
          tractName,
          neighborhood,
          stateFips,
          indicators: indicators.map((i) => ({
            key: i.key,
            label: i.label,
            value: i.value,
            severity: i.severity,
            note: i.note,
            stateAverage: i.stateAverage
              ? { value: i.stateAverage.value, label: i.stateAverage.label }
              : null,
          })),
        },
      }),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !mutation.data && !mutation.isPending) {
      mutation.mutate();
    }
    if (!next) setCopied(false);
  };

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
          disabled={indicators.length === 0}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Read the story of this neighborhood
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {neighborhood} — Tract {tractName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">An AI-written story, grounded in the indicators on this page.</p>
        </DialogHeader>

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
          AI-generated from public ACS census data and USDA food-access flags. May contain errors — verify before citing.
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
