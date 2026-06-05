// Realistic mock Hartford data. Replace with Google Sheets API later.

export type Severity = "good" | "watch" | "concern";

export type AddressLookup = {
  address: string;
  neighborhood: string;
  censusTract: string;
  yearBuilt: number;
  units: number;
  landlord: string;
  landlordContact: {
    phone?: string;
    email?: string;
    mailingAddress?: string;
  };
  landlordPortfolio: {
    propertiesInHartford: number;
    totalUnits: number;
    totalOpenCodeViolations: number;
    totalEvictions12mo: number;
    totalComplaints311_12mo: number;
    note?: string;
  };
  building: {
    codeViolations: { open: number; closed12mo: number; recent: { date: string; description: string; status: "Open" | "Closed" }[] };
    evictions: { filings12mo: number; rate: string; note: string };
    utilityShutoffs: { count12mo: number; note: string };
    complaints311: { count12mo: number; topCategory: string; recent: { date: string; type: string }[] };
  };
  area: {
    reportCard: { category: string; grade: string; severity: Severity; note: string }[];
    medianIncome: string;
    rentBurden: string;
    homeownership: string;
  };
};

const SAMPLES: Record<string, AddressLookup> = {
  default: {
    address: "555 Main Street, Hartford, CT 06103",
    neighborhood: "Upper Albany",
    censusTract: "5024.00",
    yearBuilt: 1928,
    units: 12,
    landlord: "Garden Street Holdings LLC",
    landlordContact: {
      phone: "(860) 555-0142",
      email: "manager@gardenstreetholdings.com",
      mailingAddress: "PO Box 4821, Hartford, CT 06147",
    },
    landlordPortfolio: {
      propertiesInHartford: 14,
      totalUnits: 168,
      totalOpenCodeViolations: 31,
      totalEvictions12mo: 22,
      totalComplaints311_12mo: 47,
      note: "This owner is one of the larger landlords in north Hartford.",
    },
    building: {
      codeViolations: {
        open: 3,
        closed12mo: 7,
        recent: [
          { date: "Mar 14, 2025", description: "Peeling lead paint — common stairwell", status: "Open" },
          { date: "Feb 02, 2025", description: "Inadequate heat — Unit 4", status: "Closed" },
          { date: "Jan 18, 2025", description: "Broken smoke detector — hallway", status: "Open" },
        ],
      },
      evictions: { filings12mo: 4, rate: "33%", note: "Higher than the Hartford average of 18%." },
      utilityShutoffs: { count12mo: 2, note: "Eversource reported 2 shutoffs at this address last year." },
      complaints311: {
        count12mo: 9,
        topCategory: "Trash & illegal dumping",
        recent: [
          { date: "Apr 02, 2025", type: "Bulk trash pickup" },
          { date: "Mar 21, 2025", type: "Rodent sighting" },
          { date: "Feb 12, 2025", type: "Streetlight out" },
        ],
      },
    },
    area: {
      reportCard: [
        { category: "Air quality", grade: "C", severity: "watch", note: "Above-average asthma ER visits." },
        { category: "Walkability", grade: "B", severity: "good", note: "Most errands within a 10-min walk." },
        { category: "Green space", grade: "C", severity: "watch", note: "Keney Park is nearby; few smaller parks." },
        { category: "School quality", grade: "C-", severity: "concern", note: "Elementary scores below state average." },
        { category: "Public safety", grade: "C", severity: "watch", note: "Property crime above city median." },
        { category: "Grocery access", grade: "D", severity: "concern", note: "No full-service grocer within 1 mile." },
      ],
      medianIncome: "$32,400",
      rentBurden: "58% of renters pay more than 30% of income on rent",
      homeownership: "24%",
    },
  },
};

export function lookupAddress(query: string): AddressLookup {
  const q = query.trim();
  if (!q) return SAMPLES.default;
  // Try to infer a neighborhood hint from the query string (e.g. reverse-geocoded
  // Nominatim results often include it). Fall back to the default sample data.
  const parts = q.split(",").map((s) => s.trim()).filter(Boolean);
  const street = parts[0] ?? q;
  const city = parts[1] ?? "Hartford";
  const state = parts[2] ?? "CT";
  return {
    ...SAMPLES.default,
    address: `${street}, ${city}, ${state}`,
  };
}

