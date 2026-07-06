import { useCallback, useRef, useState } from "react";

interface ShareOptions {
  title: string;
  text: string;
  filename: string;
}

interface SharePdfState {
  loading: boolean;
  error: string | null;
}

function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openMailto(subject: string, body: string) {
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

function preparePdfClone(element: HTMLElement): { clone: HTMLElement; cleanup: () => void } {
  const clone = element.cloneNode(true) as HTMLElement;

  // Hide elements that are not meant for print.
  clone.querySelectorAll(".no-print").forEach((el) => {
    if (el instanceof HTMLElement) el.style.display = "none";
  });

  // Force a PDF-safe palette so html2canvas doesn't choke on Tailwind v4 oklch/lab colors.
  const safeElements = [clone, ...Array.from(clone.querySelectorAll("*"))];
  for (const el of safeElements) {
    if (el instanceof HTMLElement) {
      el.style.setProperty("color", "#000000", "important");
      el.style.setProperty("background-color", "#ffffff", "important");
      el.style.setProperty("background", "#ffffff", "important");
      el.style.setProperty("border-color", "#cccccc", "important");
      el.style.setProperty("box-shadow", "none", "important");
      el.style.setProperty("text-shadow", "none", "important");
      // Remove Tailwind CSS variables that may resolve to oklch/lab colors.
      const props = Array.from(el.style);
      for (const prop of props) {
        if (prop.startsWith("--")) {
          el.style.removeProperty(prop);
        }
      }
    }
  }


  // Render the clone off-screen so html2canvas can measure it.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-9999px";
  container.style.width = "8.5in";
  container.style.background = "white";
  container.style.zIndex = "-1";
  container.appendChild(clone);
  document.body.appendChild(container);

  return {
    clone,
    cleanup: () => {
      if (container.parentNode) container.parentNode.removeChild(container);
    },
  };
}

export function useSharePdf() {
  const [state, setState] = useState<SharePdfState>({ loading: false, error: null });
  const abortRef = useRef(false);

  const generatePdf = useCallback(async (element: HTMLElement, filename: string): Promise<Blob> => {
    if (typeof window === "undefined") throw new Error("PDF generation is only available in the browser.");
    const html2pdf = (await import("html2pdf.js")).default;
    const { clone, cleanup } = preparePdfClone(element);
    try {
      return await html2pdf()
        .set({
          margin: [0.5, 0.5, 0.5, 0.5],
          filename,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(clone)
        .output("blob");
    } finally {
      cleanup();
    }
  }, []);


  const share = useCallback(
    async (element: HTMLElement | null, opts: ShareOptions, onBeforeCapture?: () => (() => void) | void) => {
      if (!element) {
        setState({ loading: false, error: "Nothing to share." });
        return;
      }
      setState({ loading: true, error: null });
      abortRef.current = false;

      const cleanup = onBeforeCapture?.();
      // Give React a tick to render expanded content before capturing.
      await new Promise((resolve) => setTimeout(resolve, 50));

      try {
        const blob = await generatePdf(element, opts.filename);
        cleanup?.();
        if (abortRef.current) return;

        const file = new File([blob], opts.filename, { type: "application/pdf" });
        const shareData: ShareData = { title: opts.title, text: opts.text, files: [file] };
        console.log("[useSharePdf] blob size", blob.size, "canShare", typeof navigator !== "undefined" && navigator.canShare ? navigator.canShare({ files: [file] }) : "no canShare");

        // Preferred path: native share sheet with the PDF file (mobile Mail/Gmail/etc).
        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          console.log("[useSharePdf] using navigator.share");
          await navigator.share(shareData);
          console.log("[useSharePdf] navigator.share resolved");
          setState({ loading: false, error: null });
          return;
        }

        console.log("[useSharePdf] using fallback download+mailto");
        // Desktop / unsupported clients: download the PDF and open a mailto asking the user to attach it.
        downloadPdf(blob, opts.filename);
        const body = `${opts.text}\n\nI've downloaded my plan as a PDF; please attach it to this email if it wasn't added automatically.`;
        openMailto(opts.title, body);
        setState({ loading: false, error: null });
      } catch (err) {
        console.error("[useSharePdf] error", err);
        cleanup?.();
        if (abortRef.current) return;
        const message = (err as Error)?.message ?? "Couldn't prepare the PDF.";
        setState({ loading: false, error: message });
      }
    },
    [generatePdf],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ loading: false, error: null });
  }, []);

  return { ...state, share, reset };
}

