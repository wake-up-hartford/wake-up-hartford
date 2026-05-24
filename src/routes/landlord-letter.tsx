import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Printer, Copy, Mail } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/landlord-letter")({
  head: () => ({
    meta: [
      { title: "Letter of Complaint to Your Landlord — Wake Up Wednesday" },
      {
        name: "description",
        content:
          "Generate a clear, written letter of complaint to your landlord about unsafe or unhealthy conditions in your home.",
      },
    ],
  }),
  component: LandlordLetterPage,
});

const ISSUE_OPTIONS = [
  "No heat or hot water",
  "Mold or water damage",
  "Pest infestation (rodents / roaches / bedbugs)",
  "Broken locks, doors, or windows",
  "Lead paint or chipped paint",
  "Plumbing leaks or sewage backup",
  "Electrical hazards",
  "Smoke or carbon monoxide detector not working",
  "Trash / sanitation problems",
  "Other (describe below)",
] as const;

function LandlordLetterPage() {
  const { address } = useStoredAddress();
  const lookup = useMemo(() => (address ? lookupAddress(address) : null), [address]);
  const lookupLandlordAddress = lookup?.landlordContact.mailingAddress ?? "";

  const [tenantName, setTenantName] = useState("");
  const [unit, setUnit] = useState("");
  const [tenantAddress, setTenantAddress] = useState(address ?? "");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [landlordName, setLandlordName] = useState(lookup?.landlord ?? "");
  const [landlordAddress, setLandlordAddress] = useState(lookupLandlordAddress);

  // Autofill tenant + landlord fields once the stored address resolves from localStorage.
  useEffect(() => {
    if (address && !tenantAddress) setTenantAddress(address);
    if (lookup?.landlord && !landlordName) setLandlordName(lookup.landlord);
    if (lookupLandlordAddress && !landlordAddress) setLandlordAddress(lookupLandlordAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, lookup]);
  const [issues, setIssues] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState("");
  const [firstNoticedDate, setFirstNoticedDate] = useState("");
  const [previouslyReported, setPreviouslyReported] = useState(false);
  const [previousReportNotes, setPreviousReportNotes] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const toggleIssue = (issue: string) => {
    setIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issue)) next.delete(issue);
      else next.add(issue);
      return next;
    });
  };

  const fullTenantAddress =
    [tenantAddress, unit && `Unit ${unit}`].filter(Boolean).join(", ") || "[your address]";

  const letter = useMemo(() => {
    const issueList = issues.size
      ? Array.from(issues)
          .map((i) => `  • ${i}`)
          .join("\n")
      : "  • [Describe the problem]";

    const priorBlock = previouslyReported
      ? `I have previously notified you about ${
          issues.size > 1 ? "these issues" : "this issue"
        }${previousReportNotes ? ` (${previousReportNotes})` : ""}, but the problem${
          issues.size > 1 ? "s have" : " has"
        } not been resolved.\n\n`
      : "";

    const noticedBlock = firstNoticedDate
      ? `I first noticed the condition${issues.size > 1 ? "s" : ""} on or around ${firstNoticedDate}.\n\n`
      : "";

    return `${today}

${tenantName || "[Your name]"}
${fullTenantAddress}
Hartford, CT
${tenantPhone ? tenantPhone + "\n" : ""}${tenantEmail ? tenantEmail + "\n" : ""}
${landlordName || "[Landlord / Property Manager name]"}
${landlordAddress || "[Landlord address]"}

Re: Notice of unsafe / unhealthy conditions at ${fullTenantAddress}

Dear ${landlordName || "Landlord"},

I am writing to formally notify you, in writing, of the following condition${
      issues.size > 1 ? "s" : ""
    } at the property I rent from you at ${fullTenantAddress}:

${issueList}

${details ? details.trim() + "\n\n" : ""}${noticedBlock}${priorBlock}Under Connecticut law (Conn. Gen. Stat. §47a-7), landlords are required to keep rental units in a fit and habitable condition, comply with building and housing codes, and make all necessary repairs. I am requesting that you take prompt action to remedy ${
      issues.size > 1 ? "these conditions" : "this condition"
    } within a reasonable time, and no later than 15 days from the date of this letter.

If the problem${
      issues.size > 1 ? "s are" : " is"
    } not addressed, I intend to exercise my legal options, which may include filing a complaint with the City of Hartford Department of Health and Human Services or Licenses & Inspections, contacting Connecticut Fair Housing, or pursuing remedies in housing court.

Please contact me at ${tenantPhone || "[your phone]"}${
      tenantEmail ? ` or ${tenantEmail}` : ""
    } to confirm receipt of this letter and to schedule the necessary repairs.

Thank you for your prompt attention to this matter.

Sincerely,

${tenantName || "[Your name]"}
`;
  }, [
    today,
    tenantName,
    fullTenantAddress,
    tenantPhone,
    tenantEmail,
    landlordName,
    landlordAddress,
    issues,
    details,
    firstNoticedDate,
    previouslyReported,
    previousReportNotes,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handlePrint = () => window.print();

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `Notice of unsafe / unhealthy conditions at ${fullTenantAddress}`,
    );
    const body = encodeURIComponent(letter);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <AppShell>
      <Link
        to="/home"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Your Home
      </Link>

      <header className="mb-6 print:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tenant tools
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground">
          Letter of Complaint to Your Landlord
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          A written letter creates a paper trail. Fill in the details below and we'll
          generate a clear, formal letter you can print, email, or copy.
        </p>
      </header>

      <Card className="mb-5 space-y-4 print:hidden">
        <h2 className="font-display text-lg">Your information</h2>
        <Field label="Your full name">
          <input
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
            placeholder="Jane Doe"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Street address">
            <input
              value={tenantAddress}
              onChange={(e) => setTenantAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="123 Main St"
            />
          </Field>
          <Field label="Unit (optional)">
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="2B"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Phone">
            <input
              type="tel"
              value={tenantPhone}
              onChange={(e) => setTenantPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="(860) 555-0100"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="you@example.com"
            />
          </Field>
        </div>
      </Card>

      <Card className="mb-5 space-y-4 print:hidden">
        <h2 className="font-display text-lg">Landlord information</h2>
        <Field label="Landlord or property manager name">
          <input
            value={landlordName}
            onChange={(e) => setLandlordName(e.target.value)}
            className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
            placeholder="ABC Property Management"
          />
        </Field>
        <Field label="Landlord mailing address">
          <textarea
            value={landlordAddress}
            onChange={(e) => setLandlordAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
            placeholder="456 Park Ave, Hartford, CT 06106"
          />
        </Field>
      </Card>

      <Card className="mb-5 space-y-4 print:hidden">
        <h2 className="font-display text-lg">What's wrong?</h2>
        <p className="text-[13px] text-muted-foreground">Check all that apply.</p>
        <div className="space-y-2">
          {ISSUE_OPTIONS.map((issue) => (
            <label key={issue} className="flex items-start gap-2 text-[14px] text-foreground">
              <input
                type="checkbox"
                checked={issues.has(issue)}
                onChange={() => toggleIssue(issue)}
                className="mt-1 h-4 w-4 rounded border-border accent-primary"
              />
              <span>{issue}</span>
            </label>
          ))}
        </div>
        <Field label="Describe the problem (specific rooms, dates, photos taken, anything that's been damaged)">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
            placeholder="Example: The radiator in the front bedroom has not produced heat since Nov 1. My children have been sleeping in coats."
          />
        </Field>
        <Field label="When did you first notice it? (optional)">
          <input
            value={firstNoticedDate}
            onChange={(e) => setFirstNoticedDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
            placeholder="e.g. early October 2025"
          />
        </Field>
        <label className="flex items-start gap-2 text-[14px] text-foreground">
          <input
            type="checkbox"
            checked={previouslyReported}
            onChange={(e) => setPreviouslyReported(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-primary"
          />
          <span>I've already reported this to my landlord before.</span>
        </label>
        {previouslyReported && (
          <Field label="How and when did you report it? (optional)">
            <input
              value={previousReportNotes}
              onChange={(e) => setPreviousReportNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="e.g. text message on 10/12 and phone call on 10/20"
            />
          </Field>
        )}
      </Card>

      <Card className="mb-5">
        <div className="mb-3 flex items-center justify-between print:hidden">
          <h2 className="font-display text-lg">Your letter</h2>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Preview
          </span>
        </div>
        <pre className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed text-foreground">
{letter}
        </pre>
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 print:hidden">
        <Button onClick={handlePrint} size="lg" className="w-full">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button onClick={handleEmail} size="lg" variant="secondary" className="w-full">
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button onClick={handleCopy} size="lg" variant="secondary" className="w-full">
          <Copy className="h-4 w-4" />
          {copyStatus === "copied"
            ? "Copied!"
            : copyStatus === "error"
              ? "Couldn't copy"
              : "Copy text"}
        </Button>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground print:hidden">
        Keep a copy for your records. For best results, send by certified mail (return
        receipt requested) or hand-deliver with a witness. This is a template — it is
        not legal advice. For free legal help, contact Connecticut Fair Housing Center
        or Statewide Legal Services of CT (211).
      </p>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
