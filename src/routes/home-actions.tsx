import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, FileText, Phone, Scale, Camera, ShieldCheck, Users, ClipboardList, Landmark, Megaphone, DollarSign } from "lucide-react";
import { AppShell, SectionHeader } from "@/components/AppShell";
import housingEnforcementFlyer from "@/assets/housing-enforcement-flyer.pdf.asset.json";

export const Route = createFileRoute("/home-actions")({
  head: () => ({
    meta: [
      { title: "Take Action on Your Home — Wake Up Wednesday" },
      { name: "description", content: "Concrete steps you can take to improve your housing situation in Hartford." },
    ],
  }),
  component: HomeActionsPage,
});

type Action = {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  href?: string;
  cta: string;
  href2?: string;
  cta2?: string;
  href3?: string;
  cta3?: string;
};

const ACTIONS: Action[] = [
  {
    title: "Write a complaint letter to your landlord",
    desc: "Auto-fill a formal letter citing Connecticut habitability law. Print, mail, or email it.",
    icon: FileText,
    to: "/landlord-letter",
    cta: "Start letter",
  },
  {
    title: "Report a code violation",
    desc: "Call Hartford 311 or file online to request a housing inspection for unsafe conditions.",
    icon: ClipboardList,
    href: "tel:311",
    cta: "Call 311",
    href2: "https://www.hartfordct.gov/Government/Departments/Hartford-311",
    cta2: "Go to website",
    href3: housingEnforcementFlyer.url,
    cta3: "Know When & What to Report",
  },
  {
    title: "Get free legal help",
    desc: "Greater Hartford Legal Aid and CT Fair Housing Center help tenants with evictions, repairs, and discrimination — at no cost.",
    icon: Scale,
    href: "tel:18604110050",
    cta: "Call legal aid",
    href2: "https://www.ghla.org/",
    cta2: "Go to website",
  },
  {
    title: "Call 211 for housing help",
    desc: "Connect to rental assistance, shelter, eviction prevention, and utility help any time, day or night.",
    icon: Phone,
    href: "tel:211",
    cta: "Dial 211",
    href2: "https://www.211ct.org/",
    cta2: "Go to website",
  },
  {
    title: "Document conditions with photos",
    desc: "Take dated photos and videos of every problem. This evidence protects you in court and with inspectors.",
    icon: Camera,
    cta: "Coming soon",
  },
  {
    title: "Know your rights as a tenant",
    desc: "A quick guide to repairs, security deposits, eviction notice rules, and retaliation protections in CT.",
    icon: ShieldCheck,
    cta: "Coming soon",
  },
  {
    title: "Organize with your neighbors",
    desc: "Talk to neighbors facing the same landlord. A tenant association has more power than one tenant alone.",
    icon: Users,
    cta: "Coming soon",
  },
  {
    title: "Contact your city council member",
    desc: "Tell elected officials about conditions in your building. Pressure works.",
    icon: Landmark,
    cta: "Coming soon",
  },
  {
    title: "Recover your security deposit",
    desc: "Landlords must return your deposit within 30 days. Learn how to demand it back with interest.",
    icon: DollarSign,
    cta: "Coming soon",
  },
  {
    title: "Share your story",
    desc: "Add your experience to the public record so the community can see patterns across landlords.",
    icon: Megaphone,
    cta: "Coming soon",
  },
];

function HomeActionsPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="mb-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate({ to: "/home" });
            }
          }}
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <SectionHeader
        eyebrow="Your Home"
        title="Take action"
        subtitle="Concrete steps you can take today to improve your housing situation. Pick one — small steps add up."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => (
          <ActionCard key={a.title} action={a} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Have an action step to suggest? Tell the team and we'll add it.
      </p>
    </AppShell>
  );
}

function ActionCard({ action }: { action: Action }) {
  const Icon = action.icon;
  const disabled = action.cta === "Coming soon";
  const hasSecondary = Boolean(action.href2 && action.cta2);
  const outerIsLink = !hasSecondary && !disabled && Boolean(action.to || action.href);

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg leading-tight text-card-foreground">{action.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-card-foreground/80">{action.desc}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 self-start">
        {outerIsLink && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            {action.cta}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
        {!outerIsLink && action.href && !disabled && (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {action.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {!outerIsLink && action.to && !disabled && (
          <Link
            to={action.to}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {action.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {hasSecondary && (
          <a
            href={action.href2}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {action.cta2}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {disabled && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            {action.cta}
          </span>
        )}
      </div>
    </>
  );

  const cls =
    "flex h-full flex-col rounded-2xl border border-gold/40 bg-card p-5 text-left transition hover:border-gold hover:shadow-md active:scale-[0.99]";

  if (!outerIsLink) {
    return <div className={hasSecondary ? cls : `${cls} opacity-80`}>{inner}</div>;
  }
  if (action.to) {
    return (
      <Link to={action.to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={action.href} className={cls}>
      {inner}
    </a>
  );
}
