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
  clone.id = "pdf-clone";

  // Render the clone off-screen so html2canvas can measure it.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-9999px";
  container.style.width = "8.5in";
  container.style.zIndex = "-1";
  container.appendChild(clone);
  document.body.appendChild(container);

  // Inject a stylesheet that overrides all color properties, including pseudo-elements,
  // so html2canvas doesn't trip over Tailwind v4 oklch/lab colors.
  const style = document.createElement("style");
  style.textContent = `
    #pdf-clone,
    #pdf-clone *,
    #pdf-clone *::before,
    #pdf-clone *::after {
      color: #000000 !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      border-color: #cccccc !important;
      outline-color: #cccccc !important;
      box-shadow: none !important;
      text-shadow: none !important;
      stroke: #000000 !important;
      fill: #000000 !important;
    }
    #pdf-clone .no-print,
    #pdf-clone .no-print * {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  return {
    clone,
    cleanup: () => {
      if (container.parentNode) container.parentNode.removeChild(container);
      if (style.parentNode) style.parentNode.removeChild(style);
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

        // Preferred path: native share sheet with the PDF file (mobile Mail/Gmail/etc).
        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
          setState({ loading: false, error: null });
          return;
        }

        // Desktop / unsupported clients: download the PDF and open a mailto asking the user to attach it.
        downloadPdf(blob, opts.filename);
        const body = `${opts.text}\n\nI've downloaded my plan as a PDF; please attach it to this email if it wasn't added automatically.`;
        openMailto(opts.title, body);
        setState({ loading: false, error: null });
      } catch (err) {
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
