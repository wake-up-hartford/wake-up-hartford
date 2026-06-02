export type StepRow = {
  id: string;
  week: number;
  domain: string;
  title: string;
  detail: string | null;
  resource_id: string | null;
  step_order: number;
  completed_at: string | null;
};

export type PlanShape = {
  priority_summary: string;
  crisis_flags: { note: string; hotline: string }[];
  weeks: { week: number; focus: string; steps: unknown[] }[];
};
