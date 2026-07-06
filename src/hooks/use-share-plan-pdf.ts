import { useCallback, useState } from "react";
import { generatePlanPdf, type PlanPdfInput } from "@/lib/plan-pdf";

interface ShareOptions {
  title: string;
  text: string;
  filename: string;
}

interface SharePlanPdfState {
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

export function useSharePlanPdf() {
  const [state, setState] = useState<SharePlanPdfState>({ loading: false, error: null });

  const share = useCallback(
    async (planData: PlanPdfInput | null, opts: ShareOptions) => {
      if (!planData) {
        setState({ loading: false, error: "Nothing to share." });
        return;
      }
      setState({ loading: true, error: null });

      try {
        const blob = generatePlanPdf(planData);
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
        const message = (err as Error)?.message ?? "Couldn't prepare the PDF.";
        setState({ loading: false, error: message });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return { ...state, share, reset };
}
