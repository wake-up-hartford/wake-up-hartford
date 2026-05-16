import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  Utensils,
  Heart,
  Briefcase,
  CreditCard,
  Scale,
  Shield,
  Users,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Mail,
  Send,
} from "lucide-react";
import { useMemo, useState, useEffect, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/life")({
  head: () => ({
    meta: [
      { title: "Your Life — Stabilization Survey" },
      {
        name: "description",
        content:
          "A confidential first step toward building your personal stability plan.",
      },
    ],
  }),
  component: LifePage,
});

/* ---------- Survey schema ---------- */

type QType = "single" | "multi";
type Question = {
  id: string;
  text: string;
  type: QType;
  options: string[];
  maxSelect?: number;
};
type Section = {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind gradient classes (from / to) */
  gradient: string;
  /** ring/text accent class (text-) */
  accentText: string;
  /** soft tint background */
  tint: string;
  /** css color value for inline */
  color: string;
  questions: Question[];
};

const SECTIONS: Section[] = [
  {
    id: "housing",
    name: "Housing",
    icon: HomeIcon,
    gradient: "from-emerald-500 to-emerald-600",
    accentText: "text-emerald-700",
    tint: "bg-emerald-50",
    color: "#059669",
    questions: [
      {
        id: "h1",
        type: "single",
        text: "What best describes your current housing situation?",
        options: [
          "I own or rent a stable home",
          "I rent but worried about losing it",
          "I'm staying with family or friends temporarily",
          "I'm in a shelter or transitional housing",
          "I'm experiencing homelessness",
        ],
      },
      {
        id: "h2",
        type: "single",
        text: "Is your housing at immediate risk in the next 30 days?",
        options: [
          "No",
          "Possibly — I'm behind on rent or mortgage",
          "Yes — I have an eviction notice or must leave soon",
        ],
      },
      {
        id: "h3",
        type: "multi",
        text: "What housing help do you need?",
        options: [
          "Help paying rent or mortgage",
          "Finding a new place to live",
          "Emergency shelter",
          "Housing vouchers or subsidized housing",
          "Repairs or habitability issues",
          "Nothing right now",
        ],
      },
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: Utensils,
    gradient: "from-orange-400 to-amber-500",
    accentText: "text-orange-700",
    tint: "bg-orange-50",
    color: "#ea580c",
    questions: [
      {
        id: "f1",
        type: "single",
        text: "How often do you have enough food to eat?",
        options: [
          "Always — food is not a concern",
          "Usually, but occasionally skip meals due to cost",
          "Often worried about running out of food",
          "Frequently going without enough food",
        ],
      },
      {
        id: "f2",
        type: "multi",
        text: "Are you currently using any food assistance programs?",
        options: [
          "SNAP / Food Stamps",
          "Food pantry or food bank",
          "WIC",
          "School meals program",
          "None",
          "I don't know what's available",
        ],
      },
    ],
  },
  {
    id: "health",
    name: "Health",
    icon: Heart,
    gradient: "from-rose-400 to-pink-500",
    accentText: "text-rose-700",
    tint: "bg-rose-50",
    color: "#e11d48",
    questions: [
      {
        id: "he1",
        type: "single",
        text: "Do you currently have health insurance?",
        options: [
          "Yes — employer-provided",
          "Yes — Medicaid or Medicare",
          "Yes — marketplace plan",
          "No insurance but I pay out of pocket",
          "No insurance and I avoid care due to cost",
        ],
      },
      {
        id: "he2",
        type: "multi",
        text: "Are there health needs going unaddressed?",
        options: [
          "Physical health or chronic conditions",
          "Mental health or emotional wellbeing",
          "Substance use support",
          "Dental care",
          "Vision care",
          "Prescriptions I can't afford",
          "None currently",
        ],
      },
      {
        id: "he3",
        type: "single",
        text: "How urgent are your health needs right now?",
        options: [
          "Not urgent — things are stable",
          "Moderate — needs attention within months",
          "High — needs attention within weeks",
          "Crisis — needs immediate attention",
        ],
      },
    ],
  },
  {
    id: "income",
    name: "Income",
    icon: Briefcase,
    gradient: "from-blue-500 to-sky-600",
    accentText: "text-blue-700",
    tint: "bg-blue-50",
    color: "#2563eb",
    questions: [
      {
        id: "i1",
        type: "single",
        text: "What is your current primary income source?",
        options: [
          "Full-time employment",
          "Part-time employment",
          "Self-employment or gig work",
          "Government benefits (SSI, SSDI, unemployment, etc.)",
          "No income right now",
        ],
      },
      {
        id: "i2",
        type: "single",
        text: "How would you describe your income stability?",
        options: [
          "Stable and predictable",
          "Variable but manageable",
          "Often not enough to cover basics",
          "I have no income",
        ],
      },
      {
        id: "i3",
        type: "multi",
        text: "What barriers to work or income do you face?",
        options: [
          "Lack of transportation",
          "Childcare needs",
          "Disability or health issues",
          "Criminal record",
          "Lack of skills or credentials",
          "Immigration status",
          "No barriers right now",
        ],
      },
    ],
  },
  {
    id: "debt",
    name: "Debt",
    icon: CreditCard,
    gradient: "from-purple-500 to-violet-600",
    accentText: "text-purple-700",
    tint: "bg-purple-50",
    color: "#7c3aed",
    questions: [
      {
        id: "d1",
        type: "single",
        text: "How would you describe your debt situation?",
        options: [
          "Minimal debt — I can manage it",
          "Moderate debt — it's stressful but manageable",
          "Heavy debt — I'm struggling to keep up",
          "In crisis — facing collections, lawsuits, or garnishments",
        ],
      },
      {
        id: "d2",
        type: "multi",
        text: "What types of debt do you have?",
        options: [
          "Medical bills",
          "Credit card debt",
          "Student loans",
          "Back rent or utilities",
          "Car loan or repossession",
          "Tax debt",
          "Child support arrears",
          "Payday loans",
          "No significant debt",
        ],
      },
      {
        id: "d3",
        type: "single",
        text: "Has your debt affected your ability to rent housing, get a job, or access services?",
        options: ["No", "Somewhat", "Yes — significantly"],
      },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    icon: Scale,
    gradient: "from-green-500 to-teal-600",
    accentText: "text-green-700",
    tint: "bg-green-50",
    color: "#16a34a",
    questions: [
      {
        id: "l1",
        type: "multi",
        text: "Are you dealing with any legal issues?",
        options: [
          "Criminal record or pending charges",
          "Eviction or housing court",
          "Child custody or family court",
          "Immigration proceedings",
          "Debt lawsuits or collections",
          "Benefits appeals",
          "Domestic violence or restraining order",
          "No legal issues",
        ],
      },
      {
        id: "l2",
        type: "single",
        text: "Do you have access to legal help?",
        options: [
          "Yes — I have an attorney",
          "I've used legal aid before",
          "No — I can't afford an attorney",
          "I didn't know free legal help existed",
        ],
      },
    ],
  },
  {
    id: "safety",
    name: "Safety",
    icon: Shield,
    gradient: "from-fuchsia-400 to-purple-500",
    accentText: "text-fuchsia-700",
    tint: "bg-fuchsia-50",
    color: "#c026d3",
    questions: [
      {
        id: "s1",
        type: "single",
        text: "Do you feel safe in your current living situation?",
        options: [
          "Yes — I feel safe",
          "Mostly, but some concerns",
          "No — I feel unsafe at home",
          "I'm in an unsafe situation right now",
        ],
      },
      {
        id: "s2",
        type: "multi",
        text: "If you don't feel safe, what type of safety concern is it?",
        options: [
          "Domestic violence or abuse",
          "Neighborhood violence",
          "Unsafe housing conditions",
          "Stalking or harassment",
          "I feel safe — skip this",
        ],
      },
    ],
  },
  {
    id: "support",
    name: "Community",
    icon: Users,
    gradient: "from-teal-400 to-cyan-600",
    accentText: "text-teal-700",
    tint: "bg-teal-50",
    color: "#0d9488",
    questions: [
      {
        id: "su1",
        type: "single",
        text: "How would you describe your personal support network?",
        options: [
          "Strong — family or friends I can rely on",
          "Some support, but limited",
          "Very little — mostly on my own",
          "None — completely isolated",
        ],
      },
      {
        id: "su2",
        type: "single",
        text: "Do you have children or dependents you are caring for?",
        options: [
          "No",
          "Yes — children under 18",
          "Yes — elderly or disabled adult",
          "Yes — both",
        ],
      },
      {
        id: "su3",
        type: "multi",
        text: "What feels most urgent to you right now?",
        maxSelect: 3,
        options: [
          "Getting stable housing",
          "Having enough food",
          "Medical or mental health care",
          "Steady income or employment",
          "Managing debt",
          "Resolving a legal issue",
          "Feeling safe",
          "Emotional support or connection",
        ],
      },
    ],
  },
];

type Answers = Record<string, string[]>;

/* ---------- Top component ---------- */

function LifePage() {
  const [stage, setStage] = useState<"intro" | "survey" | "summary">("intro");
  const [answers, setAnswers] = useState<Answers>({});

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Start
      </Link>

      {stage === "intro" && <IntroScreen onBegin={() => setStage("survey")} />}
      {stage === "survey" && (
        <SurveyScreen
          answers={answers}
          setAnswers={setAnswers}
          onFinish={() => setStage("summary")}
        />
      )}
      {stage === "summary" && (
        <SummaryScreen
          answers={answers}
          onRestart={() => {
            setAnswers({});
            setStage("intro");
          }}
        />
      )}
    </AppShell>
  );
}

/* ---------- Intro ---------- */

function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Stabilization Survey
      </p>
      <p className="mb-2 font-mono text-[12px] font-semibold uppercase tracking-wider text-emerald-600">
        ▸ Your Path Forward
      </p>
      <h1 className="font-display text-3xl leading-tight text-foreground">
        Life Stabilization Survey
      </h1>
      <p className="mt-3 italic text-[15px] leading-relaxed text-muted-foreground">
        A confidential first step toward building your personal stability plan.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-[14px] leading-relaxed text-card-foreground">
          This survey takes about <strong>5–8 minutes</strong>. Your answers will be used to
          create a clear, prioritized action plan tailored to your situation. There are no
          wrong answers — be as honest as you can.
        </p>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-900/30 bg-[oklch(0.22_0.08_260)] p-4 text-blue-50">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
        <p className="text-[13px] leading-relaxed">
          Your responses are private and used only to generate your personalized plan.
          This is not a diagnostic tool.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-[13px] leading-relaxed text-card-foreground">
          This survey covers <strong>8 areas of life</strong> that most affect
          stability — from housing and food to safety, income, and legal needs.
        </p>
        <div className="mt-4 flex items-center justify-between">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: s.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onBegin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-4 text-[15px] font-semibold text-white shadow-soft transition-transform active:scale-[0.99]"
      >
        Begin Survey <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------- Survey ---------- */

function SurveyScreen({
  answers,
  setAnswers,
  onFinish,
}: {
  answers: Answers;
  setAnswers: (fn: (prev: Answers) => Answers) => void;
  onFinish: () => void;
}) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);

  const section = SECTIONS[sectionIdx];
  const question = section.questions[questionIdx];
  const Icon = section.icon;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sectionIdx, questionIdx]);

  const isLastQuestion =
    sectionIdx === SECTIONS.length - 1 &&
    questionIdx === section.questions.length - 1;

  const totalQuestions = SECTIONS.reduce((n, s) => n + s.questions.length, 0);
  const answeredCount = SECTIONS.slice(0, sectionIdx).reduce(
    (n, s) => n + s.questions.length,
    0,
  ) + questionIdx;
  const pct = Math.round((answeredCount / totalQuestions) * 100);

  const selected = answers[question.id] ?? [];
  const canContinue = selected.length > 0;

  const toggle = (opt: string) => {
    setAnswers((prev) => {
      const cur = prev[question.id] ?? [];
      if (question.type === "single") return { ...prev, [question.id]: [opt] };
      if (cur.includes(opt))
        return { ...prev, [question.id]: cur.filter((o) => o !== opt) };
      if (question.maxSelect && cur.length >= question.maxSelect) return prev;
      return { ...prev, [question.id]: [...cur, opt] };
    });
  };

  const goBack = () => {
    if (questionIdx > 0) setQuestionIdx(questionIdx - 1);
    else if (sectionIdx > 0) {
      const prev = SECTIONS[sectionIdx - 1];
      setSectionIdx(sectionIdx - 1);
      setQuestionIdx(prev.questions.length - 1);
    }
  };

  const goNext = () => {
    if (isLastQuestion) return onFinish();
    if (questionIdx < section.questions.length - 1) setQuestionIdx(questionIdx + 1);
    else {
      setSectionIdx(sectionIdx + 1);
      setQuestionIdx(0);
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>
            Section {sectionIdx + 1} of {SECTIONS.length}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Category badge */}
      <div
        className={`mb-4 inline-flex items-center gap-2 rounded-full ${section.tint} px-3 py-1.5`}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: section.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className={`text-[12px] font-semibold ${section.accentText}`}>
          {section.name}
        </span>
        <span className="text-[11px] text-muted-foreground">
          · Q{questionIdx + 1} of {section.questions.length}
        </span>
      </div>

      <h2 className="mb-1 font-display text-[22px] leading-snug text-foreground">
        {question.text}
      </h2>
      <p className="mb-4 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
        {question.type === "single"
          ? "Select one"
          : question.maxSelect
            ? `Select up to ${question.maxSelect}`
            : "Select all that apply"}
      </p>

      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                isSel
                  ? "border-transparent shadow-soft"
                  : "border-border bg-card hover:bg-secondary/50"
              }`}
              style={
                isSel
                  ? {
                      backgroundColor: `color-mix(in oklab, ${section.color} 12%, var(--card))`,
                      borderColor: section.color,
                    }
                  : undefined
              }
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                  question.type === "single" ? "rounded-full" : "rounded"
                }`}
                style={{
                  borderColor: isSel ? section.color : "var(--border)",
                  backgroundColor: isSel ? section.color : "transparent",
                }}
              >
                {isSel && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                )}
              </span>
              <span className="text-[14px] leading-snug text-card-foreground">{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={goBack}
          disabled={sectionIdx === 0 && questionIdx === 0}
          className="flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-3 text-[14px] font-semibold text-card-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={goNext}
          disabled={!canContinue}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${section.gradient} px-4 py-3 text-[14px] font-semibold text-white shadow-soft transition-all disabled:opacity-40`}
        >
          {isLastQuestion ? "Finish Survey" : "Continue"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Summary ---------- */

const HIGH_KW = ["crisis", "immediate", "unsafe", "eviction", "no income", "frequently"];
const MOD_KW = ["worried", "often", "high", "moderate"];

function scoreSection(section: Section, answers: Answers): "high" | "moderate" | "stable" {
  let high = 0;
  let mod = 0;
  for (const q of section.questions) {
    const sel = answers[q.id] ?? [];
    for (const a of sel) {
      const lower = a.toLowerCase();
      if (HIGH_KW.some((k) => lower.includes(k))) high++;
      else if (MOD_KW.some((k) => lower.includes(k))) mod++;
    }
  }
  if (high > 0) return "high";
  if (mod > 0) return "moderate";
  return "stable";
}

function SummaryScreen({
  answers,
  onRestart,
}: {
  answers: Answers;
  onRestart: () => void;
}) {
  const priorities = answers["su3"] ?? [];

  const ranked = useMemo(() => {
    const order = { high: 0, moderate: 1, stable: 2 } as const;
    return SECTIONS.map((s) => ({ s, score: scoreSection(s, answers) })).sort(
      (a, b) => order[a.score] - order[b.score],
    );
  }, [answers]);

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl text-foreground">Survey Complete</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Here's a preview of your priority areas based on your responses.
        </p>
      </div>

      {priorities.length > 0 && (
        <div className="mb-5 rounded-2xl border border-blue-900/30 bg-[oklch(0.22_0.08_260)] p-4 text-blue-50">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            Your stated priorities
          </p>
          <ul className="space-y-1.5">
            {priorities.map((p) => (
              <li key={p} className="flex items-start gap-2 text-[14px]">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-300" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-5 space-y-2">
        {ranked.map(({ s, score }, i) => {
          const Icon = s.icon;
          const badge =
            score === "high"
              ? { label: "High Priority", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" }
              : score === "moderate"
                ? { label: "Moderate Priority", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" }
                : { label: "Stable / Monitoring", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft"
            >
              <span className="font-display text-[15px] text-muted-foreground w-5 text-center">
                {i + 1}
              </span>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: s.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-[14px] font-semibold text-card-foreground">
                {s.name}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full ${badge.bg} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-dashed border-blue-400/60 bg-blue-50/60 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-[13px] leading-relaxed text-slate-700">
          <strong>Next step:</strong> An AI-generated stabilization plan will be created
          based on your responses — with specific resources, steps, and timelines.
        </p>
      </div>

      <PlanSignupForm />

      <button
        onClick={onRestart}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-5 py-3 text-[14px] font-semibold text-muted-foreground hover:bg-secondary/50"
      >
        Start Over <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PlanSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wantInfo, setWantInfo] = useState(false);
  const [wantSms, setWantSms] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneValid = !wantSms || /^[\d().+\-\s]{7,}$/.test(phone.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phoneValid) {
      setError("Please enter a valid phone number for text messages.");
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="font-display text-lg text-emerald-900">You're all set</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-emerald-800">
          Your stabilization plan will be sent to <strong>{email}</strong> shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <Mail className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-[17px] leading-tight text-card-foreground">
            Get your AI stabilization plan
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Enter your email to receive your personalized plan.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Name <span className="font-normal normal-case text-muted-foreground/70">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/50 p-3 hover:bg-background">
          <input
            type="checkbox"
            checked={wantInfo}
            onChange={(e) => setWantInfo(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-600"
          />
          <span className="text-[13px] leading-relaxed text-card-foreground">
            Send me more information about <strong>Wake Up Wednesday</strong> and related resources.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/50 p-3 hover:bg-background">
          <input
            type="checkbox"
            checked={wantSms}
            onChange={(e) => setWantSms(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-600"
          />
          <span className="text-[13px] leading-relaxed text-card-foreground">
            Text me about <strong>Wake Up Wednesday</strong> campaigns.
          </span>
        </label>

        {wantSms && (
          <div className="pl-7">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Cell phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Standard message and data rates may apply.
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft transition hover:from-blue-700 hover:to-indigo-700"
        >
          <Send className="h-4 w-4" />
          Send my plan
        </button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Your information stays private and is only used to deliver what you've requested.
        </p>
      </div>
    </form>
  );
}
