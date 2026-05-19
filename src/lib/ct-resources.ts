import resources from "@/data/ct-resources.json";

export type CTResource = {
  id: string;
  name: string;
  domain: string;
  services: string[];
  phone: string;
  address: string;
  town: string;
  county: string;
  hours: string;
  languages: string[];
  eligibility_notes: string;
  url: string;
  source: string;
};

const byId = new Map<string, CTResource>(
  (resources as CTResource[]).map((r) => [r.id, r]),
);

export function getResource(id: string | null | undefined): CTResource | undefined {
  if (!id) return undefined;
  return byId.get(id);
}
