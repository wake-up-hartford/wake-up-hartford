type Props = {
  week: number;
  dueIsoForInput: string;
  isCustom: boolean;
  onChange: (week: number, isoDate: string | null) => void;
  onClose: () => void;
};

export function DueDateEditor({ week, dueIsoForInput, isCustom, onChange, onClose }: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2.5">
      <label className="text-[12px] font-semibold text-foreground">Due date:</label>
      <input
        type="date"
        value={dueIsoForInput}
        onChange={(e) => onChange(week, e.target.value || null)}
        className="rounded-md border border-border bg-card px-2 py-1 text-[13px] text-foreground"
      />
      {isCustom && (
        <button
          type="button"
          onClick={() => onChange(week, null)}
          className="text-[12px] font-semibold text-muted-foreground underline hover:text-foreground"
        >
          Reset
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="ml-auto text-[12px] font-semibold text-accent hover:underline"
      >
        Done
      </button>
    </div>
  );
}
