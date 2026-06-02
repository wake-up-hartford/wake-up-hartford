import { CheckCircle2, Circle, ExternalLink, Phone } from "lucide-react";
import { getResource } from "@/lib/ct-resources";
import { fireConfetti } from "@/lib/confetti";
import type { StepRow } from "@/lib/plan-types";

type Props = {
  step: StepRow;
  onToggle: (stepId: string, done: boolean) => void;
};

export function StepItem({ step, onToggle }: Props) {
  const r = getResource(step.resource_id);
  const isDone = !!step.completed_at;
  return (
    <li className="rounded-xl border border-border/70 bg-step-surface p-3">
      <button
        onClick={(e) => {
          const willComplete = !isDone;
          onToggle(step.id, willComplete);
          if (willComplete) fireConfetti(e.currentTarget);
        }}
        className="flex w-full items-start gap-3 text-left"
      >
        {isDone ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        ) : (
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-step-surface-muted" />
        )}
        <div className="flex-1">
          <p className={`text-[14px] font-semibold ${isDone ? "text-step-surface-muted line-through" : "text-step-surface-foreground"}`}>
            {step.title}
          </p>
          {step.detail && (
            <p className="mt-1 text-[13px] leading-relaxed text-step-surface-foreground/90">{step.detail}</p>
          )}
          <span className="mt-1 inline-block rounded-full bg-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pill-foreground">
            {step.domain}
          </span>
        </div>
      </button>
      {r && (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-step-resource p-3">
          <p className="text-[13px] font-semibold text-step-resource-foreground">{r.name}</p>
          <p className="text-[12px] text-step-resource-muted">{r.eligibility_notes}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
            {r.phone && r.phone !== "n/a" && (
              <a href={`tel:${r.phone.replace(/[^\d]/g, "")}`} className="inline-flex items-center gap-1 text-success">
                <Phone className="h-3.5 w-3.5" /> {r.phone}
              </a>
            )}
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent">
                <ExternalLink className="h-3.5 w-3.5" /> Website
              </a>
            )}
          </div>
          <p className="mt-1 text-[11px] text-step-resource-muted">{r.town} · {r.hours}</p>
        </div>
      )}
    </li>
  );
}
