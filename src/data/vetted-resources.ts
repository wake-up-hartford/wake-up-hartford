// Curated CT organizations, tagged by domain. Mirrors the vetted-ct-resources doc.
// `tags` align with indicator keys so the action page can prioritize relevant orgs.

export type ResourceTag =
  | "housing"
  | "rent"
  | "legal"
  | "food"
  | "health"
  | "uninsured"
  | "income"
  | "jobs"
  | "education"
  | "youth"
  | "civic"
  | "general";

export type Resource = {
  name: string;
  description: string;
  phone?: string;
  url?: string;
  tags: ResourceTag[];
};

export const VETTED_RESOURCES: Resource[] = [
  // Housing & legal
  {
    name: "Connecticut Fair Housing Center",
    description: "Free legal help for tenants facing eviction, discrimination, or unsafe conditions.",
    phone: "888-247-4401",
    url: "https://www.ctfairhousing.org",
    tags: ["housing", "rent", "legal"],
  },
  {
    name: "Statewide Legal Services of CT",
    description: "Free civil legal aid for low-income residents — housing, benefits, family.",
    phone: "800-453-3320",
    url: "https://slsct.org",
    tags: ["legal", "housing", "rent", "general"],
  },
  {
    name: "Greater Hartford Legal Aid",
    description: "Free legal help in housing, public benefits, and family law for Hartford-area residents.",
    phone: "860-541-5000",
    url: "https://www.ghla.org",
    tags: ["legal", "housing", "rent"],
  },
  {
    name: "Center for Children's Advocacy — RAYS",
    description: "Legal advocacy for kids and youth in housing, school, and health crises.",
    phone: "860-570-5327",
    url: "https://cca-ct.org",
    tags: ["legal", "youth", "housing"],
  },
  {
    name: "Journey Home Hartford",
    description: "Coordinates Hartford's response to homelessness — call 2-1-1 for shelter intake.",
    phone: "211",
    url: "https://journeyhomect.org",
    tags: ["housing", "general"],
  },

  // Food
  {
    name: "Foodshare / Connecticut Foodbank",
    description: "Mobile food pantries across Hartford and statewide distribution.",
    phone: "860-286-9999",
    url: "https://www.ctfoodshare.org",
    tags: ["food"],
  },
  {
    name: "Hands On Hartford — Community Meals",
    description: "Free hot meals, food pantry, and benefits enrollment in Hartford.",
    phone: "860-728-3201",
    url: "https://www.handsonhartford.org",
    tags: ["food", "general"],
  },
  {
    name: "End Hunger Connecticut!",
    description: "SNAP outreach and free help applying for food benefits.",
    phone: "860-560-2100",
    url: "https://www.endhungerct.org",
    tags: ["food"],
  },

  // Health & insurance
  {
    name: "Charter Oak Health Center",
    description: "Federally qualified health center — sliding-scale primary care for uninsured/under-insured.",
    phone: "860-550-7500",
    url: "https://thecharteroakhealth.com",
    tags: ["health", "uninsured"],
  },
  {
    name: "Community Health Services Hartford",
    description: "Primary care, behavioral health, dental — accepts uninsured patients.",
    phone: "860-249-9625",
    url: "https://www.chshartford.org",
    tags: ["health", "uninsured"],
  },
  {
    name: "Access Health CT",
    description: "Connecticut's health insurance marketplace — free enrollment help.",
    phone: "855-805-4325",
    url: "https://www.accesshealthct.com",
    tags: ["health", "uninsured"],
  },

  // Income, jobs, education
  {
    name: "Capital Workforce Partners",
    description: "Free job training, resume help, and apprenticeships for North-Central CT.",
    phone: "860-522-1111",
    url: "https://capitalworkforce.org",
    tags: ["jobs", "income"],
  },
  {
    name: "Capital Community College — Adult Education",
    description: "Free GED, ESL, and college-prep classes in downtown Hartford.",
    phone: "860-906-5000",
    url: "https://www.capitalcc.edu",
    tags: ["education", "jobs"],
  },
  {
    name: "Connecticut Department of Labor — CT Hires",
    description: "Statewide job board, unemployment claims, and career counseling.",
    phone: "860-263-6000",
    url: "https://www.ctdol.state.ct.us",
    tags: ["jobs", "income"],
  },
  {
    name: "VITA — Free Tax Help",
    description: "Free tax prep (including EITC) for households under ~$64K.",
    phone: "211",
    url: "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers",
    tags: ["income", "general"],
  },

  // Civic & advocacy
  {
    name: "Greater Hartford Branch NAACP",
    description: "Civil rights advocacy, complaint intake, and civic organizing.",
    url: "https://www.naacphartford.org",
    tags: ["civic", "legal"],
  },
  {
    name: "CT Secretary of the State — Voter Lookup",
    description: "Check or update your voter registration; find your polling place.",
    url: "https://portaldir.ct.gov/sots/LookUp.aspx",
    tags: ["civic"],
  },
  {
    name: "Hartford 311",
    description: "Report potholes, trash, streetlights, blight, and other city issues.",
    phone: "311",
    url: "https://www.hartfordct.gov/Government/Departments/311-Customer-Service",
    tags: ["civic", "general"],
  },
];

// Map indicator keys (from neighborhood-indicators.ts) to resource tag priorities.
export const INDICATOR_TO_TAGS: Record<string, ResourceTag[]> = {
  child_poverty: ["food", "income", "youth"],
  median_income: ["jobs", "income"],
  unemployment: ["jobs", "income"],
  education: ["education", "jobs"],
  food_access: ["food"],
  uninsured: ["health", "uninsured"],
  age_of_housing: ["housing", "legal"],
  rent_burden: ["rent", "housing", "legal"],
  tenure: ["housing"],
  population: ["civic"],
};
