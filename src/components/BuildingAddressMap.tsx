import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Approx bounding box of Hartford, CT
const HARTFORD_CENTER: [number, number] = [41.7637, -72.6851];

type LatLng = { lat: number; lng: number };

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const a = j.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(" ");
    const city = a.city || a.town || a.village || a.hamlet || a.suburb || "Hartford";
    const state = a.state_code || a.state || "CT";
    if (!street) return j.display_name ?? null;
    return `${street}, ${city}, ${state}`;
  } catch {
    return null;
  }
}

async function forwardGeocode(address: string): Promise<LatLng | null> {
  try {
    const q = encodeURIComponent(
      /hartford/i.test(address) ? address : `${address}, Hartford, CT`,
    );
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
  } catch {
    return null;
  }
}

function ClickHandler({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ pos }: { pos: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], 16, { animate: true });
  }, [pos, map]);
  return null;
}

/** Clickable Hartford map for picking an address. */
export function PickAddressMap({ onPick }: { onPick: (address: string) => void }) {
  const [pin, setPin] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);

  const handleClick = async (p: LatLng) => {
    setPin(p);
    setLoading(true);
    const addr = await reverseGeocode(p.lat, p.lng);
    setLoading(false);
    if (addr) onPick(addr);
  };

  const handleTypedSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = typed.trim();
    if (!value) return;
    setTypedError(null);
    setLoading(true);
    const p = await forwardGeocode(value);
    setLoading(false);
    if (p) {
      setPin(p);
      onPick(/hartford/i.test(value) ? value : `${value}, Hartford, CT`);
    } else {
      setTypedError("We couldn't find that address. Try including a street and city.");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {loading ? "Looking up address…" : "Click and hold anywhere on map to drop a pin."}
      </p>
      <div
        role="region"
        aria-label="Map of Hartford. Click to drop a pin and look up an address, or use the text field below to type an address."
        className="overflow-hidden rounded-xl border border-border"
      >
        <MapContainer
          center={HARTFORD_CENTER}
          zoom={13}
          style={{ height: 320, width: "100%" }}
          scrollWheelZoom={false}
          keyboard
          keyboardPanDelta={80}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleClick} />
          {pin && <Marker position={[pin.lat, pin.lng]} />}
        </MapContainer>
      </div>

      {/* Keyboard / screen-reader accessible alternative to clicking the map */}
      <form onSubmit={handleTypedSubmit} className="flex flex-col gap-1.5">
        <label
          htmlFor="address-input"
          className="text-xs font-medium text-muted-foreground"
        >
          Or type a Hartford address
        </label>
        <div className="flex gap-2">
          <input
            id="address-input"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="e.g. 1212 Main St"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-describedby={typedError ? "address-input-error" : undefined}
            aria-invalid={typedError ? true : undefined}
          />
          <button
            type="submit"
            disabled={loading || typed.trim().length === 0}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            Use address
          </button>
        </div>
        {typedError ? (
          <p id="address-input-error" className="text-xs text-destructive" role="alert">
            {typedError}
          </p>
        ) : null}
      </form>
    </div>
  );
}


/** Read-only map showing where the looked-up address is. */
export function AddressLocationMap({ address }: { address: string }) {
  const [pos, setPos] = useState<LatLng | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErr(false);
    setPos(null);
    forwardGeocode(address).then((p) => {
      if (cancelled) return;
      if (p) setPos(p);
      else setErr(true);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const center = useMemo<[number, number]>(
    () => (pos ? [pos.lat, pos.lng] : HARTFORD_CENTER),
    [pos],
  );

  if (err) return null;

  return (
    <div
      role="img"
      aria-label={`Map showing the approximate location of ${address}`}
      className="overflow-hidden rounded-xl border border-border"
    >
      <MapContainer
        center={center}
        zoom={pos ? 16 : 12}
        style={{ height: 180, width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter pos={pos} />
        {pos && <Marker position={[pos.lat, pos.lng]} />}
      </MapContainer>
    </div>
  );
}
