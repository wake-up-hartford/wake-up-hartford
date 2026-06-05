// Shared Web Share + clipboard fallback used by Home and Neighborhood share cards.
export type ShareStatus = "copied" | "error";

export async function shareOrCopy(opts: { title: string; text: string; url?: string }): Promise<ShareStatus | null> {
  const url = opts.url ?? (typeof window !== "undefined" ? window.location.href : "");
  const payload = `${opts.text}\n${url}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return null;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return null;
      // fall through to clipboard
    }
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
    } else if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = payload;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    return "copied";
  } catch {
    return "error";
  }
}
