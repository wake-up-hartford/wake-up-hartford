import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, FileText, Phone, Scale, ShieldCheck, Users, ClipboardList, Landmark, Megaphone, DollarSign } from "lucide-react";
import { AppShell, SectionHeader } from "@/components/AppShell";

export const Route = createFileRoute("/home-actions")({
  head: () => ({
    meta: [
      { title: "Take Action on Your Home — Wake Up Wednesday" },
      { name: "description", content: "Concrete steps you can take to improve your housing situation in Hartford." },
    ],
  }),
  component: HomeActionsPage,
});

/**
 * A link inside an action card. Provide either `to` (internal route) or
 * `href` (external URL / tel: / mailto:). The first link in `links` is
 * rendered as the primary CTA, the rest as muted secondary buttons.
 */
type ActionLink = {
  label: string;
  to?: string;
  href?: string;
};

type Action = {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  links?: ActionLink[];
  /** When true, render a disabled "Coming soon" pill instead of links. */
  comingSoon?: boolean;
};

const ACTIONS: Action[] = [
  {
    title: "Write a complaint letter to your landlord",
    desc: "Auto-fill a formal letter citing Connecticut habitability law. Print, mail, or email it.",
    icon: FileText,
    links: [{ label: "Start letter", to: "/landlord-letter" }],
  },
  {
    title: "Report a code violation",
    desc: "Call Hartford 311 or file online to request a housing inspection for unsafe conditions.",
    icon: ClipboardList,
    links: [
      { label: "Call 311", href: "tel:311" },
      { label: "Website", href: "https://www.hartfordct.gov/Government/Departments/Hartford-311" },
      {
        label: "Download 'Know When & What to Report'",
        href: "https://www.hartfordct.gov/files/assets/public/v/1/hartford-311/hartford-311-documents/housing-enforcement-flyer.pdf",
      },
    ],
  },
  {
    title: "Get free legal help",
    desc: "Greater Hartford Legal Aid and CT Fair Housing Center help tenants with evictions, repairs, and discrimination — at no cost.",
    icon: Scale,
    links: [
      { label: "Call legal aid", href: "tel:18604110050" },
      { label: "Website", href: "https://www.ghla.org/" },
    ],
  },
  {
    title: "Recover your security deposit",
    desc: "Landlords must return your deposit, with interest, within 21 days of your written demand. Generate the letter.",
    icon: DollarSign,
    links: [{ label: "Start letter", to: "/security-deposit-letter" }],
  },
  {
    title: "Call 211 for housing help",
    desc: "Connect to rental assistance, shelter, eviction prevention, and utility help any time, day or night.",
    icon: Phone,
    links: [
      { label: "Dial 211", href: "tel:211" },
      { label: "Website", href: "https://www.211ct.org/" },
    ],
  },
  {
    title: "Know your rights as a tenant",
    desc: "A quick guide to repairs, security deposits, eviction notice rules, and retaliation protections in CT.",
    icon: ShieldCheck,
    links: [{ label: "Learn your rights", href: "https://ctlawhelp.org/en/housing/landlord-tenant/renters-rights" }],
  },
  {
    title: "Organize with your neighbors",
    desc: "Talk to neighbors facing the same landlord. A tenant association has more power than one tenant alone.",
    icon: Users,
  },
  {
    title: "Contact your city council member",
    desc: "Tell elected officials about conditions in your building. Pressure works.",
    icon: Landmark,
    links: [{ label: "Find your council member", href: "https://hartford.civicweb.net/portal/members.aspx?id=10" }],
  },
  {
    title: "Share your story",
    desc: "Add your experience to the public record so the community can see patterns across landlords.",
    icon: Megaphone,
    comingSoon: true,
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

const cardClass =
  "flex h-full flex-col rounded-2xl border border-gold/40 bg-card p-5 text-left transition hover:border-gold hover:shadow-md active:scale-[0.99]";

const primaryPillClass =
  "inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/85";

const secondaryPillClass =
  "inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80";

function ActionCard({ action }: { action: Action }) {
  const Icon = action.icon;
  const links = action.links ?? [];
  // When there's exactly one link and no "coming soon" badge, the whole card
  // becomes the link target — gives a bigger tap area on mobile.
  const wholeCardIsLink = !action.comingSoon && links.length === 1;
  const [primary, ...secondary] = links;

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
      <div className="mt-4 flex flex-wrap items-center gap-2 self-start">
        {action.comingSoon ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground/60">
            Coming soon
          </span>
        ) : (
          <>
            {primary && (
              wholeCardIsLink ? (
                // Outer <a>/<Link> wraps the card; render the primary CTA as a non-interactive pill.
                <span className={primaryPillClass.replace(" hover:bg-foreground/85", "")}>
                  {primary.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              ) : (
                <PillLink link={primary} className={primaryPillClass} />
              )
            )}
            {secondary.map((link) => (
              <PillLink key={link.label} link={link} className={secondaryPillClass} external />
            ))}
          </>
        )}
      </div>
    </>
  );

  if (wholeCardIsLink && primary) {
    if (primary.to) {
      return <Link to={primary.to} className={cardClass}>{inner}</Link>;
    }
    return <a href={primary.href} className={cardClass}>{inner}</a>;
  }
  return <div className={cardClass}>{inner}</div>;
}

function PillLink({
  link,
  className,
  external = false,
}: {
  link: ActionLink;
  className: string;
  external?: boolean;
}) {
  const content = (
    <>
      {link.label}
      <ArrowRight className="h-3.5 w-3.5" />
    </>
  );
  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </a>
  );
}
