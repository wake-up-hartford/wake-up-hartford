import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Printer, Copy, Mail } from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStoredAddress } from "@/lib/address-store";
import { lookupAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/security-deposit-letter")({
  head: () => ({
    meta: [
      { title: "Security Deposit Demand Letter — Wake Up Wednesday" },
      {
        name: "description",
        content:
          "Generate a letter demanding the return of your security deposit, with interest, under Connecticut law.",
      },
    ],
  }),
  component: SecurityDepositLetterPage,
});

function SecurityDepositLetterPage() {
  const { address } = useStoredAddress();
  const lookup = useMemo(() => (address ? lookupAddress(address) : null), [address]);
  const lookupLandlordAddress = lookup?.landlordContact.mailingAddress ?? "";

  const [tenantName, setTenantName] = useState("");
  const [rentalAddress, setRentalAddress] = useState(address ?? "");
  const [unit, setUnit] = useState("");
  const [moveOutDate, setMoveOutDate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [landlordName, setLandlordName] = useState(lookup?.landlord ?? "");
  const [landlordAddress, setLandlordAddress] = useState(lookupLandlordAddress);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (address && !rentalAddress) setRentalAddress(address);
    if (lookup?.landlord && !landlordName) setLandlordName(lookup.landlord);
    if (lookupLandlordAddress && !landlordAddress) setLandlordAddress(lookupLandlordAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, lookup]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const fullRentalAddress =
    [rentalAddress, unit && `Unit ${unit}`].filter(Boolean).join(", ") ||
    "[address of the place you rented]";

  const letter = useMemo(() => {
    return `TO: ${landlordName || "[Landlord's name]"}
${landlordAddress || "[Landlord's address]"}
${today}

I was a tenant at ${fullRentalAddress}.

My move-out date was ${moveOutDate || "[date you moved]"}.

The law says you must return my security deposit, ${
      depositAmount ? `$${depositAmount}` : "[amount you paid]"
    } plus interest, within 21 days of receiving this letter. Please mail it to me at this address: ${
      mailingAddress || "[address where you can get mail]"
    }.

Sincerely,


${tenantName || "[Your printed name]"}
${today}
`;
  }, [
    today,
    tenantName,
    fullRentalAddress,
    moveOutDate,
    depositAmount,
    mailingAddress,
    landlordName,
    landlordAddress,
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
      `Demand for return of security deposit — ${fullRentalAddress}`,
    );
    const body = encodeURIComponent(letter);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <AppShell>
      <Link
        to="/home-actions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Take Action
      </Link>

      <header className="mb-6 print:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tenant tools
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground">
          Security Deposit Demand Letter
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Under Connecticut law, your landlord must return your security deposit, plus
          interest, within 21 days of receiving your written demand. Fill in the
          details below to generate your letter.
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
          <Field label="Address of the place you rented">
            <input
              value={rentalAddress}
              onChange={(e) => setRentalAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="123 Main St, Hartford, CT"
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
          <Field label="Move-out date">
            <input
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="e.g. May 31, 2026"
            />
          </Field>
          <Field label="Security deposit amount paid">
            <input
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
              placeholder="e.g. 1500"
            />
          </Field>
        </div>
        <Field label="Address where you can receive mail">
          <textarea
            value={mailingAddress}
            onChange={(e) => setMailingAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-[#e8dcc0] text-stone-900 placeholder:text-stone-500 px-3 py-2 text-[14px]"
            placeholder="789 New St, Hartford, CT 06106"
          />
        </Field>
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

      <pre id="print-letter" className="hidden">{letter}</pre>

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
        Send this letter by certified mail (return receipt requested) so you have
        proof of when your landlord received it. Keep a copy for your records. Letter
        language adapted from{" "}
        <a
          href="https://ctlawhelp.org/en/housing/landlord-tenant/security-deposits"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          CTLawHelp.org
        </a>
        . This is a template — it is not legal advice.
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
