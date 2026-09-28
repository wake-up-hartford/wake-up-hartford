import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TRACT_TO_NEIGHBORHOOD } from "@/data/hartford-neighborhood-data";

export type GeocodedNeighborhoodResult = {
  address: string;
  neighborhood: string;
  tractFips: string;
  error?: string;
};

const GeocodeInput = z.object({
  address: z.string().trim().min(5).max(200),
});

/**
 * Resolves a street address to one of Hartford's 17 neighborhoods.
 * Uses the US Census geocoder to find the 2020/2022 census tract, then the
 * CT Data Collaborative tract-to-neighborhood crosswalk.
 */
export const geocodeAddressToNeighborhood = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GeocodeInput.parse(input))
  .handler(async ({ data }): Promise<GeocodedNeighborhoodResult> => {
    const empty = { address: data.address, neighborhood: "", tractFips: "" };
    try {
      const url = new URL(
        "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress",
      );
      url.searchParams.set("address", data.address);
      url.searchParams.set("benchmark", "Public_AR_Current");
      url.searchParams.set("vintage", "Current_Current");
      url.searchParams.set("layers", "Census Tracts");
      url.searchParams.set("format", "json");

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`Geocoder ${res.status}`);

      const json = (await res.json()) as {
        result?: {
          addressMatches?: Array<{
            matchedAddress?: string;
            geographies?: Record<
              string,
              Array<{
                STATE?: string | number;
                COUNTY?: string | number;
                TRACT?: string | number;
              }>
            >;
          }>;
        };
      };

      const match = json?.result?.addressMatches?.[0];
      if (!match) {
        return {
          ...empty,
          error: "No match found. Try a more complete Hartford street address.",
        };
      }

      const t = match.geographies?.["Census Tracts"]?.[0];
      const matched = match.matchedAddress ?? data.address;
      if (!t?.STATE || !t?.COUNTY || !t?.TRACT) {
        return {
          ...empty,
          address: matched,
          error: "Address matched but no neighborhood could be determined.",
        };
      }

      const fips =
        String(t.STATE).padStart(2, "0") +
        String(t.COUNTY).padStart(3, "0") +
        String(t.TRACT).padStart(6, "0");

      const neighborhood = TRACT_TO_NEIGHBORHOOD[fips];
      if (!neighborhood) {
        return {
          address: matched,
          neighborhood: "",
          tractFips: fips,
          error:
            "That address is outside the City of Hartford. Neighborhood data currently covers Hartford's 17 neighborhoods.",
        };
      }

      return { address: matched, neighborhood, tractFips: fips };
    } catch (err) {
      console.error("geocodeAddressToNeighborhood failed", err);
      return {
        ...empty,
        error: "Couldn't reach the address lookup service. Please try again.",
      };
    }
  });
