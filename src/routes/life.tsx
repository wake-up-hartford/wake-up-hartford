import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  LogIn,
  FileText,
} from "lucide-react";
import { useMemo, useState, useEffect, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { generateStabilizationPlan } from "@/lib/stabilization-plan.functions";
import { trackEvent } from "@/lib/track-event";

export const Route = createFileRoute("/life")({
  head: () => ({
    meta: [
      { title: "Your Life — Stabilization Survey" },
      {
        name: "description",
        content:
          "A confidential first step toward building your personal stability plan.",
      },
      { property: "og:title", content: "Your Life — Stabilization Survey" },
      { property: "og:description", content: "A confidential first step toward building your personal stability plan." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/life" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/life" },
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

const LIFE_STATE_KEY = "wuw:life:pendingSurvey";

function LifePage() {
  const [stage, setStage] = useState<"intro" | "survey" | "summary">("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const { user, loading: authLoading } = useAuth();
  const [restored, setRestored] = useState(false);

  // Restore in-progress survey after returning from /auth.
  useEffect(() => {
    if (restored) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LIFE_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: Answers; stage?: "intro" | "survey" | "summary" };
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.stage) setStage(parsed.stage);
      }
    } catch {
      // ignore
    }
    setRestored(true);
  }, [restored]);

  // Persist survey state so auth round-trips don't lose progress.
  useEffect(() => {
    if (!restored || typeof window === "undefined") return;
    if (stage === "intro" && Object.keys(answers).length === 0) {
      window.localStorage.removeItem(LIFE_STATE_KEY);
      return;
    }
    window.localStorage.setItem(LIFE_STATE_KEY, JSON.stringify({ answers, stage }));
  }, [answers, stage, restored]);



  return (
    <AppShell>
      {stage === "intro" && (
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      )}
      {stage === "summary" && (
        <button
          type="button"
          onClick={() => setStage("intro")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Your Life
        </button>
      )}

      {stage === "intro" && <IntroScreen onBegin={() => setStage("survey")} />}
      {stage === "survey" && (
        <SurveyScreen
          answers={answers}
          setAnswers={setAnswers}
          onBack={() => setStage("intro")}
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

      {stage === "intro" && (
        <Link
          to="/plans"
          className="mt-5 flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 transition active:scale-[0.99]"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] leading-tight text-foreground">My plans</p>
            <p className="text-[12px] text-muted-foreground">Stabilization plans you've saved.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}


    </AppShell>
  );
}


/* ---------- Intro ---------- */

function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-foreground">
        Build Your Path to Stability
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Life can get hard. This short survey takes 5-8 minutes. Answer a few questions and we'll build you a free, personal AI-generated 30-day <span className="text-emerald-600 font-semibold">ACTION PLAN</span> — with real resources in Connecticut to help you move forward.
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <h2 className="font-display text-base leading-tight text-foreground">What you'll get</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] text-foreground">
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>A personalized 30-day plan</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Specific Hartford and Connecticut resources</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>Concrete steps you can start this week</span></li>
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg leading-tight text-card-foreground">
          8 areas of life
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-card-foreground">
          The survey covers eight areas that affect day-to-day stability.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-y-4 gap-x-2">
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
                <span className="text-[12px] font-semibold text-card-foreground">
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onBegin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-5 font-display text-[20px] font-semibold text-white shadow-soft transition-transform active:scale-[0.99]"
      >
        Enter Here <ArrowRight className="h-5 w-5" />
      </button>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
        <button
          onClick={onBegin}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-4 py-3 text-[14px] font-semibold text-white shadow-lg"
        >
          Start the survey <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}



/* ---------- Survey ---------- */

function SurveyScreen({
  answers,
  setAnswers,
  onBack,
  onFinish,
}: {
  answers: Answers;
  setAnswers: (fn: (prev: Answers) => Answers) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [started, setStarted] = useState(false);

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

  if (!started) {
    return (
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Your Life
        </button>

        <div className="mb-5 space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-900/30 bg-[oklch(0.22_0.08_260)] p-4 text-blue-50">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
            <div>
              <h2 className="mb-1 font-display text-[16px] font-semibold text-white">Trust</h2>
              <p className="text-[15px] leading-relaxed">
                We know trust matters. Your answers are private and secure. We will never share or sell your information.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { trackEvent("life_survey_start"); setStarted(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-5 font-display text-[20px] font-semibold text-white shadow-soft transition-transform active:scale-[0.99]"
        >
          Start Life Survey <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div>

      {/* Progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between font-semibold uppercase tracking-wider">
          <span className="text-[13px] text-foreground">
            Question {answeredCount + 1} of {totalQuestions}
          </span>
          <span className="text-[11px] text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Section {sectionIdx + 1} of {SECTIONS.length} · {section.name}
        </p>
      </div>


      {/* Category badge */}
      <div className="mb-4 inline-flex items-center gap-2.5 rounded-2xl border border-border bg-transparent px-4 py-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: section.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className={`text-[15px] font-semibold ${section.accentText}`}>
          {section.name}
        </span>
        <span className="text-[12px] font-semibold text-foreground">
          · Q{questionIdx + 1} of {section.questions.length}
        </span>
      </div>

      <h2 className="mb-1 font-display text-[19px] leading-snug text-foreground">
        {question.text}
      </h2>
      <p className="mb-4 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
        {question.type === "single"
          ? "Select one"
          : question.maxSelect
            ? `Select up to ${question.maxSelect}`
            : "Select all that apply"}
      </p>

      <div className="space-y-1.5">
        {question.options.map((opt) => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-all ${
                isSel
                  ? "border-transparent shadow-soft"
                  : "border-border bg-card"
              }`}
              style={
                isSel
                  ? {
                      backgroundColor: `color-mix(in oklab, ${section.color} 12%, var(--card))`,
                      borderColor: section.color,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isSel) {
                  e.currentTarget.style.backgroundColor = section.color;
                  e.currentTarget.style.borderColor = section.color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSel) {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.borderColor = "";
                }
              }}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                  question.type === "single" ? "rounded-full" : "rounded"
                } group-hover:border-white`}
                style={{
                  borderColor: isSel ? section.color : "var(--border)",
                  backgroundColor: isSel ? section.color : "transparent",
                }}
              >
                {isSel && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                )}
              </span>
              <span className="text-[14px] leading-snug text-card-foreground group-hover:text-[var(--primary-foreground)]">{opt}</span>
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
      {question.type === "multi" && (
        <button
          type="button"
          onClick={() => {
            setAnswers((prev) => ({ ...prev, [question.id]: [] }));
            goNext();
          }}
          className="mt-3 w-full text-center text-[13px] text-muted-foreground underline hover:text-foreground"
        >
          Skip this question
        </button>
      )}

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
  const { user } = useAuth();

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

      <div className="mb-5">
        <h3 className="text-4xl font-bold tracking-tight text-amber-500">Next step</h3>
        {user ? (
          <>
            <p className="mt-2 text-[14px] leading-relaxed text-blue-50/90">
              An AI-generated Plan will be created based on your responses — with specific
              resources, steps, and timelines.
            </p>
            <PlanGenerator
              scores={Object.fromEntries(ranked.map(({ s, score }) => [s.id, score === "high" ? "high" : score === "moderate" ? "moderate" : "stable"]))}
              priorities={priorities}
            />
          </>
        ) : (
          <>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Your AI-generated Plan — built from your unique responses — includes specific resources, steps, and timelines. Sign in to access it. Your plan is private and will never be shared.
            </p>
            <Link
              to="/auth"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("wuw:postAuthRedirect", "/life");
                }
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft"
            >
              <LogIn className="h-4 w-4" /> Sign in to access your plan
            </Link>
          </>
        )}
      </div>

      <button
        onClick={onRestart}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-5 py-3 text-[14px] font-semibold text-muted-foreground hover:bg-secondary/50"
      >
        Start Over <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------- Plan generator ---------- */

type Transport = "car" | "bus" | "walking" | "none";
const BENEFIT_OPTIONS = ["SNAP", "HUSKY/Medicaid", "WIC", "Section 8", "Care 4 Kids", "TANF"];

function PlanGenerator({
  scores,
  priorities,
}: {
  scores: Record<string, "high" | "moderate" | "stable">;
  priorities: string[];
}) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const genFn = useServerFn(generateStabilizationPlan);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [hours, setHours] = useState(5);
  const [transport, setTransport] = useState<Transport>("bus");
  const [language, setLanguage] = useState("en");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [worry, setWorry] = useState("");
  const [county, setCounty] = useState("Hartford");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;


  const toggleBenefit = (b: string) => {
    setBenefits((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await genFn({
        data: {
          survey: { scores, priorities },
          followup: {
            adults,
            children,
            hoursPerWeek: hours,
            transport,
            language,
            benefits,
            worry,
            county,
          },
        },
      });
      nav({ to: "/plan/$planId", params: { planId: result.planId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate your plan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-display text-[18px] leading-tight text-card-foreground">
        A few last questions
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        These help this plan pick resources that actually fit your life.
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Adults in household" value={adults} setValue={setAdults} min={1} max={10} />
          <NumberField label="Children" value={children} setValue={setChildren} min={0} max={10} />
        </div>

        <div>
          <Label>County in CT</Label>
          <select value={county} onChange={(e) => setCounty(e.target.value)} className="input">
            {["Hartford", "New Haven", "Fairfield", "New London", "Litchfield", "Middlesex", "Tolland", "Windham"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Hours per week you can spend on this plan: {hours}</Label>
          <input type="range" min={1} max={15} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <Label>How you get around</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["car", "bus", "walking", "none"] as Transport[]).map((t) => (
              <button key={t} type="button" onClick={() => setTransport(t)}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium capitalize ${transport === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border bg-background text-muted-foreground"}`}>
                {t === "none" ? "no reliable transport" : t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Preferred language</Label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <div>
          <Label>Benefits you're already getting (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {BENEFIT_OPTIONS.map((b) => (
              <button key={b} type="button" onClick={() => toggleBenefit(b)}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium ${benefits.includes(b) ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border bg-background text-muted-foreground"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Biggest worry right now (optional, one sentence)</Label>
          <textarea value={worry} onChange={(e) => setWorry(e.target.value)} rows={2} maxLength={280}
            placeholder="e.g. My landlord said I have to be out by the 30th."
            className="input" />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>}

        <button onClick={handleGenerate} disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60">
          {busy ? "Building your plan…" : (<><Sparkles className="h-4 w-4" /> Generate my 30-day plan</>)}
        </button>
        {busy && <p className="text-center text-[12px] text-muted-foreground">This takes about 10 seconds.</p>}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</label>;
}

function NumberField({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => setValue(Math.max(min, value - 1))} className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-secondary text-base leading-none text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">−</button>
        <span className="flex-1 text-center text-[15px] font-semibold text-card-foreground" aria-live="polite">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => setValue(Math.min(max, value + 1))} className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-secondary text-base leading-none text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">+</button>
      </div>
    </div>
  );
}
