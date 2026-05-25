import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react";
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
import { generateTractStory, type Tone } from "@/lib/tract-story.functions";
import type { Indicator } from "@/lib/tract-indicators.functions";


const TONE_STORAGE_KEY = "wuw.tract-story.tone";
const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "warm", label: "Warm & hopeful" },
  { value: "direct", label: "Direct & practical" },
];

type Props = {
  tractName: string;
  neighborhood: string;
  indicators: Indicator[];
  stateFips?: string;
};

const CACHE_PREFIX = "wuw.tract-story.v1:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type CacheEntry = { story: string; savedAt: number };

function readCache(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.story) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.story;
  } catch {
    return null;
  }
}

function writeCache(key: string, story: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ story, savedAt: Date.now() } satisfies CacheEntry),
    );
  } catch {
    // ignore quota / disabled storage
  }
}

export function TractStoryDialog({ tractName, neighborhood, indicators, stateFips }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cachedStory, setCachedStory] = useState<string | null>(null);
  const [tone, setToneState] = useState<Tone>("warm");
  const generate = useServerFn(generateTractStory);

  // Load saved tone preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TONE_STORAGE_KEY);
      if (saved === "warm" || saved === "direct") setToneState(saved);
    } catch {}
  }, []);

  const setTone = (next: Tone) => {
    setToneState(next);
    try { localStorage.setItem(TONE_STORAGE_KEY, next); } catch {}
  };

  // Cache key includes tract + state + tone + a fingerprint of the indicators so
  // the cache invalidates if the underlying data or tone changes.
  const cacheKey = useMemo(() => {
    const fingerprint = indicators
      .map((i) => `${i.key}=${i.value}|${i.severity}`)
      .join(";");
    return `${stateFips ?? "00"}:${tractName}:${tone}:${fingerprint}`;
  }, [tractName, stateFips, tone, indicators]);

  const mutation = useMutation({
    mutationFn: () =>
      generate({
        data: {
          tractName,
          neighborhood,
          stateFips,
          tone,
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
    onSuccess: (result) => {
      if (result?.story) writeCache(cacheKey, result.story);
    },
  });

  const story = mutation.data?.story ?? cachedStory;

  const loadForCurrentKey = () => {
    const cached = readCache(cacheKey);
    if (cached) {
      setCachedStory(cached);
      mutation.reset();
    } else {
      setCachedStory(null);
      mutation.reset();
      mutation.mutate();
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      const cached = readCache(cacheKey);
      if (cached) {
        setCachedStory(cached);
      } else if (!mutation.data && !mutation.isPending) {
        setCachedStory(null);
        mutation.mutate();
      }
    }
    if (!next) setCopied(false);
  };

  const handleToneChange = (next: Tone) => {
    if (next === tone) return;
    setTone(next);
    if (open) {
      // Defer to next tick so cacheKey recomputes with new tone before lookup
      setTimeout(loadForCurrentKey, 0);
    }
  };

  const handleRegenerate = () => {
    setCachedStory(null);
    mutation.reset();
    mutation.mutate();
  };


  const handleCopy = async () => {
    if (!story) return;
    await navigator.clipboard.writeText(story);
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

        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tone</span>
          <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
            {TONE_OPTIONS.map((opt) => {
              const active = tone === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToneChange(opt.value)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>


        <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1 py-2">
          {mutation.isPending && !story && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Writing the story…</p>
            </div>
          )}

          {!story && mutation.isError && (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-destructive">Couldn't generate the story.</p>
              <Button size="sm" variant="outline" onClick={() => mutation.mutate()}>
                Try again
              </Button>
            </div>
          )}

          {!story && mutation.data?.error && (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-destructive">{mutation.data.error}</p>
              <Button size="sm" variant="outline" onClick={() => mutation.mutate()}>
                Try again
              </Button>
            </div>
          )}

          {story && (
            <div className="space-y-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {story.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>

        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          AI-generated from public ACS census data and USDA food-access flags. Saved locally and reused next time you open this tract. May contain errors — verify before citing.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          {story && (
            <>
              <ListenButton text={story} cacheKey={cacheKey} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={mutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${mutation.isPending ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
