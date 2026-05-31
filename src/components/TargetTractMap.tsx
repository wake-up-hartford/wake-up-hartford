import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import geojsonRaw from "@/data/hartford-target-tracts.geojson?raw";
import { GROUP_COLORS, GROUP_LABELS, type TargetTract } from "@/data/hartford-target-tracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TractProps = {
  geoid: string;
  state: string;
  county: string;
  tract: string;
  tractName: string;
  neighborhood: string;
  group: TargetTract["group"];
};

export type SelectedTract = {
  address: string;
  state: string;
  county: string;
  tract: string;
  tractName: string;
  neighborhood: string;
};

const data = JSON.parse(geojsonRaw) as FeatureCollection<Geometry, TractProps>;

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [12, 12] });
    map.zoomIn(0.8, { animate: false });

  }, [map, bounds]);
  return null;
}

export default function TargetTractMap({
  selectedTract,
  onSelect,
}: {
  selectedTract: string | null;
  onSelect: (t: SelectedTract) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [picked, setPicked] = useState<TractProps | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

  const bounds = useMemo<L.LatLngBoundsExpression>(() => {
    const layer = L.geoJSON(data);
    const b = layer.getBounds();
    return [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
  }, []);

  const style = (feature?: Feature<Geometry, TractProps>) => {
    if (!feature) return {};
    const p = feature.properties;
    const isSelected = p.tract === selectedTract;
    const isPicked = picked?.tract === p.tract;
    const isHovered = hovered === p.tract;
    const color = GROUP_COLORS[p.group];
    return {
      color: isSelected || isPicked ? "#0f172a" : color,
      weight: isSelected || isPicked ? 2.5 : isHovered ? 2 : 1.2,
      fillColor: color,
      fillOpacity: isSelected ? 0.7 : isPicked ? 0.55 : isHovered ? 0.5 : 0.35,
    };
  };

  // Re-style when selection/hover changes
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setStyle(style as L.StyleFunction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTract, picked, hovered]);

  const onEachFeature = (feature: Feature<Geometry, TractProps>, layer: L.Layer) => {
    const p = feature.properties;
    layer.on({
      click: () => setPicked(p),
      mouseover: () => setHovered(p.tract),
      mouseout: () => setHovered(null),
    });
  };

  const handleConfirm = () => {
    if (!picked) return;
    onSelect({
      address: `Census Tract ${picked.tractName}, Hartford, CT`,
      state: picked.state,
      county: picked.county,
      tract: picked.tract,
      tractName: picked.tractName,
      neighborhood: `${picked.neighborhood}, Hartford`,
    });
  };

  // Build a sorted list of tracts that appear on the map (for the keyboard fallback).
  const tractOptions = useMemo(() => {
    return data.features
      .map((f) => f.properties)
      .sort((a, b) => a.tractName.localeCompare(b.tractName));
  }, []);

  const handleSelectChange = (tractCode: string) => {
    const found = tractOptions.find((p) => p.tract === tractCode) ?? null;
    setPicked(found);
  };

  return (
    <div className="space-y-2.5">
      {picked ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground">
              Tract {picked.tractName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {picked.neighborhood}, Hartford
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5 sm:py-2.5 sm:text-base"
          >
            View this neighborhood
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Tap a tract on the map, or use the dropdown below, to select it.
        </p>
      )}

      <div
        role="region"
        aria-label="Map of Hartford target census tracts. Use the dropdown below to select a tract with the keyboard."
        className="overflow-hidden rounded-xl border border-border"
      >
        <MapContainer
          style={{ height: 320, width: "100%" }}
          scrollWheelZoom={false}
          zoomControl
          attributionControl
          keyboard
          keyboardPanDelta={80}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />
          <GeoJSON
            data={data}
            style={style as L.StyleFunction}
            onEachFeature={onEachFeature}
            ref={(r) => {
              layerRef.current = r;
            }}
          />
        </MapContainer>
      </div>

      {/* Keyboard / screen-reader accessible alternative to clicking the map */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tract-select"
          className="text-xs font-medium text-muted-foreground"
        >
          Or select a tract from the list
        </label>
        <select
          id="tract-select"
          value={picked?.tract ?? ""}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">— Choose a census tract —</option>
          {tractOptions.map((p) => (
            <option key={p.tract} value={p.tract}>
              Tract {p.tractName} — {p.neighborhood}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: GROUP_COLORS[key as TargetTract["group"]] }}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </div>

    </div>
  );
}

