import { Calendar, ChevronDown } from "lucide-react";
import { StepItem } from "./StepItem";
import { DueDateEditor } from "./DueDateEditor";
import type { StepRow } from "@/lib/plan-types";

type Props = {
  week: number;
  focus?: string;
  steps: StepRow[];
  dueDate: Date | null;
  isCustom: boolean;
  isCollapsed: boolean;
  isEditing: boolean;
  onToggleCollapse: (week: number) => void;
  onStartEdit: (week: number) => void;
  onCloseEdit: () => void;
  onChangeDueDate: (week: number, isoDate: string | null) => void;
  onToggleStep: (stepId: string, done: boolean) => void;
};

export function WeekCard({
  week,
  focus,
  steps,
  dueDate,
  isCustom,
  isCollapsed,
  isEditing,
  onToggleCollapse,
  onStartEdit,
  onCloseEdit,
  onChangeDueDate,
  onToggleStep,
}: Props) {
  const dueIsoForInput = dueDate
    ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`
    : "";
  const weekDone = steps.filter((s) => s.completed_at).length;
  const weekTotal = steps.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <button
        type="button"
        onClick={() => onToggleCollapse(week)}
        className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-left"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl text-card-foreground">Week {week}</h2>
          {dueDate && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStartEdit(week); }}
              aria-label={`Edit due date for week ${week}`}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                isCustom
                  ? "bg-accent/15 text-accent hover:bg-accent/25"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              <Calendar className="h-3 w-3" />
              by {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </button>
          )}
          {weekTotal > 0 && (
            <span className="text-[11px] font-semibold text-success">
              {weekDone}/{weekTotal} done
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {focus && <span className="font-display text-[17px] leading-tight text-card-foreground">{focus}</span>}
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
        </div>
      </button>
      {isEditing && (
        <DueDateEditor
          week={week}
          dueIsoForInput={dueIsoForInput}
          isCustom={isCustom}
          onChange={onChangeDueDate}
          onClose={onCloseEdit}
        />
      )}
      {!isCollapsed && (
        <ul className="space-y-3">
          {steps.map((s) => (
            <StepItem key={s.id} step={s} onToggle={onToggleStep} />
          ))}
        </ul>
      )}
    </div>
  );
}
