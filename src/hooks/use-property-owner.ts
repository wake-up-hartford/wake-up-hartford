import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lookupHartfordAddress } from "@/lib/address-lookup.functions";

// The owner of a Hartford address, from the city's records, or "" if the
// address isn't in them. Shares its cache with the Your Home report, so an
// address someone just looked up there doesn't need a second lookup.
// mailingAddress comes from the city's property records; whether owners who
// are people are included is set in src/lib/address-lookup.functions.ts.
export function usePropertyOwner(address: string | null): {
  owner: string;
  mailingAddress: string;
  isLoading: boolean;
} {
  const lookup = useServerFn(lookupHartfordAddress);
  const { data, isLoading } = useQuery({
    queryKey: ["hartford-address", address],
    queryFn: () => lookup({ data: { query: address! } }),
    enabled: !!address,
    staleTime: 60_000,
  });
  const found = data?.status === "found" ? data : null;
  return {
    owner: found?.address.owner ?? "",
    mailingAddress: found?.address.ownerMailingAddress ?? "",
    isLoading: !!address && isLoading,
  };
}
