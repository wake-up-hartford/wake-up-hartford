import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { synthesizeStory } from "@/lib/tts.functions";

type Props = {
  text: string | null | undefined;
  /** Stable cache key (e.g. tract id + tone + language). Audio is cached per key in memory. */
  cacheKey: string;
  language?: "en" | "es";
};

const audioCache = new Map<string, string>(); // cacheKey -> object URL

export function ListenButton({ text, cacheKey, language = "en" }: Props) {
  const synth = useServerFn(synthesizeStory);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Stop & reset whenever the underlying text changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setStatus("idle");
    setErrMsg(null);
  }, [cacheKey]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const playFromUrl = (url: string) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setStatus("idle");
    audio.onpause = () => {
      if (!audio.ended) setStatus("paused");
    };
    audio.onplay = () => setStatus("playing");
    audio.onerror = () => {
      setStatus("error");
      setErrMsg("Couldn't play audio.");
    };
    void audio.play().catch(() => {
      setStatus("error");
      setErrMsg("Couldn't play audio.");
    });
  };

  const handleClick = async () => {
    if (!text) return;

    if (status === "playing" && audioRef.current) {
      audioRef.current.pause();
      return;
    }
    if (status === "paused" && audioRef.current) {
      void audioRef.current.play();
      return;
    }

    const cached = audioCache.get(cacheKey);
    if (cached) {
      playFromUrl(cached);
      return;
    }

    setStatus("loading");
    setErrMsg(null);
    try {
      const result = await synth({ data: { text } });
      if ("error" in result) throw new Error(result.error);
      const url = `data:${result.mimeType};base64,${result.audioBase64}`;
      audioCache.set(cacheKey, url);
      playFromUrl(url);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "Couldn't generate audio.");
    }
  };


  const disabled = !text || status === "loading";
  const label =
    status === "loading"
      ? "Loading…"
      : status === "playing"
        ? "Pause"
        : status === "paused"
          ? "Resume"
          : "Click to Listen";
  const Icon =
    status === "loading" ? Loader2 : status === "playing" ? Pause : status === "paused" ? Play : Volume2;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled}>
        <Icon className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} />
        {label}
      </Button>
      {status === "error" && errMsg && (
        <span className="text-xs text-destructive">{errMsg}</span>
      )}
    </div>
  );
}
