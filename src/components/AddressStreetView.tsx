import { useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

let mapsLoader: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as unknown as { google?: { maps?: unknown } };
  if (w.google?.maps) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Missing Google Maps browser key"));
  mapsLoader = new Promise<void>((resolve, reject) => {
    const cbName = "__lovableInitMaps_" + Math.random().toString(36).slice(2);
    (window as unknown as Record<string, unknown>)[cbName] = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${cbName}${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

async function geocode(address: string): Promise<LatLng | null> {
  try {
    const q = encodeURIComponent(/hartford/i.test(address) ? address : `${address}, Hartford, CT`);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
  } catch {
    return null;
  }
}

export function AddressStreetView({ address }: { address: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "none" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const pos = await geocode(address);
        if (cancelled || !pos) {
          if (!cancelled) setStatus("none");
          return;
        }
        await loadMaps();
        if (cancelled || !ref.current) return;
        const g = (window as unknown as { google: any }).google;
        const svService = new g.maps.StreetViewService();
        svService.getPanorama(
          { location: pos, radius: 80, source: g.maps.StreetViewSource.OUTDOOR },
          (data: any, s: string) => {
            if (cancelled || !ref.current) return;
            if (s !== "OK" || !data?.location?.latLng) {
              setStatus("none");
              return;
            }
            const heading = g.maps.geometry?.spherical
              ? g.maps.geometry.spherical.computeHeading(data.location.latLng, new g.maps.LatLng(pos.lat, pos.lng))
              : 0;
            new g.maps.StreetViewPanorama(ref.current, {
              pano: data.location.pano,
              pov: { heading, pitch: 0 },
              zoom: 0,
              addressControl: false,
              fullscreenControl: false,
              motionTracking: false,
              motionTrackingControl: false,
              showRoadLabels: false,
            });
            setStatus("ready");
          },
        );
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (status === "none" || status === "error") {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-xl border border-white/20 bg-black/20 text-xs text-primary-foreground/70">
        Street view not available for this address
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Google Street View of ${address}`}
      className="overflow-hidden rounded-xl border border-white/20"
    >
      <div ref={ref} style={{ height: 180, width: "100%" }} />
    </div>
  );
}
