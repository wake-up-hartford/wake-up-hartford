import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/AppShell";
import { Field, LetterPage, letterInputClass } from "@/components/letter/LetterPage";
import { useStoredAddress } from "@/lib/address-store";
import { usePropertyOwner } from "@/hooks/use-property-owner";

export const Route = createFileRoute("/landlord-letter")({
  head: () => ({
    meta: [
      { title: "Letter of Complaint to Your Landlord — Wake Up Wednesday" },
      {
        name: "description",
        content:
          "Generate a clear, written letter of complaint to your landlord about unsafe or unhealthy conditions in your home.",
      },
      { property: "og:title", content: "Letter of Complaint to Your Landlord — Wake Up Wednesday" },
      { property: "og:description", content: "Generate a clear, written letter of complaint to your landlord about unsafe or unhealthy conditions in your home." },
      { property: "og:url", content: siteUrl("/landlord-letter") },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/landlord-letter") },
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
  const { owner, mailingAddress } = usePropertyOwner(address);

  const [tenantName, setTenantName] = useState("");
  const [unit, setUnit] = useState("");
  const [tenantAddress, setTenantAddress] = useState(address ?? "");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [landlordName, setLandlordName] = useState("");
  // Pre-filled only when the owner is an organization; otherwise the resident fills it in.
  const [landlordAddress, setLandlordAddress] = useState("");

  // Autofill the tenant address and the owner's name and mailing address once they load.
  useEffect(() => {
    if (address && !tenantAddress) setTenantAddress(address);
    if (owner && !landlordName) setLandlordName(owner);
    if (mailingAddress && !landlordAddress) setLandlordAddress(mailingAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, owner, mailingAddress]);
  const [issues, setIssues] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState("");
  const [firstNoticedDate, setFirstNoticedDate] = useState("");
  const [previouslyReported, setPreviouslyReported] = useState(false);
  const [previousReportNotes, setPreviousReportNotes] = useState("");

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

  return (
    <LetterPage
      backTo="/home"
      backLabel="Back to your report"
      backSearch={address ? { address } : undefined}
      eyebrow="Tenant tools"
      title="Letter of Complaint to Your Landlord"
      intro="A written letter creates a paper trail. Fill in the details below and we'll generate a clear, formal letter you can print, email, or copy."
      letter={letter}
      emailSubject={`Notice of unsafe / unhealthy conditions at ${fullTenantAddress}`}
      disclaimer="Keep a copy for your records. For best results, send by certified mail (return receipt requested) or hand-deliver with a witness. This is a template — it is not legal advice. For free legal help, contact Connecticut Fair Housing Center or Statewide Legal Services of CT (211)."
    >
      <Card className="mb-5 space-y-4 print:hidden">
        <h2 className="font-display text-lg">Your information</h2>
        <Field label="Your full name">
          <input
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className={letterInputClass}
            placeholder="Jane Doe"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Street address">
            <input
              value={tenantAddress}
              onChange={(e) => setTenantAddress(e.target.value)}
              className={letterInputClass}
              placeholder="123 Main St"
            />
          </Field>
          <Field label="Unit (optional)">
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={letterInputClass}
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
              className={letterInputClass}
              placeholder="(860) 555-0100"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              className={letterInputClass}
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
            className={letterInputClass}
            placeholder="ABC Property Management"
          />
        </Field>
        <Field
          label="Landlord mailing address"
          note="We fill in the owner from city records, and the mailing address when the owner is a company. That's often an LLC, which may not be who handles repairs. If you pay rent to a property manager, use their name and address instead."
        >
          <textarea
            value={landlordAddress}
            onChange={(e) => setLandlordAddress(e.target.value)}
            rows={2}
            className={letterInputClass}
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
            className={`${letterInputClass} !rounded-xl placeholder:italic`}
            placeholder="Example: The radiator in the front bedroom has not produced heat since Nov 1. My children have been sleeping in coats."
          />
        </Field>
        <Field label="When did you first notice it? (optional)">
          <input
            value={firstNoticedDate}
            onChange={(e) => setFirstNoticedDate(e.target.value)}
            className={letterInputClass}
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
              className={letterInputClass}
              placeholder="e.g. text message on 10/12 and phone call on 10/20"
            />
          </Field>
        )}
      </Card>
    </LetterPage>
  );
}
