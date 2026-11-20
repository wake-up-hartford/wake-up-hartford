import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/AppShell";
import { Field, LetterPage, letterInputClass } from "@/components/letter/LetterPage";
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
      { property: "og:title", content: "Security Deposit Demand Letter — Wake Up Wednesday" },
      { property: "og:description", content: "Generate a letter demanding the return of your security deposit, with interest, under Connecticut law." },
      { property: "og:url", content: siteUrl("/security-deposit-letter") },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/security-deposit-letter") },
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

  return (
    <LetterPage
      backTo="/home-actions"
      backLabel="Back to Take Action"
      eyebrow="Tenant tools"
      title="Security Deposit Demand Letter"
      intro="Under Connecticut law, your landlord must return your security deposit, plus interest, within 21 days of receiving your written demand. Fill in the details below to generate your letter."
      letter={letter}
      emailSubject={`Demand for return of security deposit — ${fullRentalAddress}`}
      disclaimer={
        <>
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
        </>
      }
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
          <Field label="Address of the place you rented">
            <input
              value={rentalAddress}
              onChange={(e) => setRentalAddress(e.target.value)}
              className={letterInputClass}
              placeholder="123 Main St, Hartford, CT"
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
          <Field label="Move-out date">
            <input
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className={letterInputClass}
              placeholder="e.g. May 31, 2026"
            />
          </Field>
          <Field label="Security deposit amount paid">
            <input
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className={letterInputClass}
              placeholder="e.g. 1500"
            />
          </Field>
        </div>
        <Field label="Address where you can receive mail">
          <textarea
            value={mailingAddress}
            onChange={(e) => setMailingAddress(e.target.value)}
            rows={2}
            className={letterInputClass}
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
            className={letterInputClass}
            placeholder="ABC Property Management"
          />
        </Field>
        <Field label="Landlord mailing address">
          <textarea
            value={landlordAddress}
            onChange={(e) => setLandlordAddress(e.target.value)}
            rows={2}
            className={letterInputClass}
            placeholder="456 Park Ave, Hartford, CT 06106"
          />
        </Field>
      </Card>
    </LetterPage>
  );
}
