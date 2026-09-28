import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import geojsonRaw from "@/data/hartford-neighborhoods.geojson?raw";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NeighborhoodProps = { name: string; id: string };

export type SelectedNeighborhood = { name: string; address: string };

const data = JSON.parse(geojsonRaw) as FeatureCollection<Geometry, NeighborhoodProps>;

// A stable, readable palette so each neighborhood is visually distinct.
const PALETTE = [
  "#1d4ed8", "#b91c1c", "#047857", "#b45309", "#7c3aed",
  "#0e7490", "#be123c", "#4d7c0f", "#c2410c", "#0f766e",
  "#6d28d9", "#a16207", "#1e40af", "#9d174d", "#15803d",
  "#92400e", "#3730a3",
];

const colorFor = (name: string) => {
  const idx = data.features.findIndex((f) => f.properties.name === name);
  return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
};

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [12, 12] });
  }, [map, bounds]);
  return null;
}

export default function HartfordNeighborhoodMap({
  selectedNeighborhood,
  onSelect,
}: {
  selectedNeighborhood: string | null;
  onSelect: (n: SelectedNeighborhood) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

  const bounds = useMemo<L.LatLngBoundsExpression>(() => {
    const b = L.geoJSON(data).getBounds();
    return [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
  }, []);

  const style = (feature?: Feature<Geometry, NeighborhoodProps>) => {
    if (!feature) return {};
    const name = feature.properties.name;
    const isSelected = name === selectedNeighborhood;
    const isPicked = picked === name;
    const isHovered = hovered === name;
    const color = colorFor(name);
    return {
      color: isSelected || isPicked ? "#0f172a" : color,
      weight: isSelected || isPicked ? 2.5 : isHovered ? 2 : 1.2,
      fillColor: color,
      fillOpacity: isSelected ? 0.7 : isPicked ? 0.55 : isHovered ? 0.5 : 0.35,
    };
  };

  useEffect(() => {
    if (layerRef.current) layerRef.current.setStyle(style as L.StyleFunction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNeighborhood, picked, hovered]);

  const onEachFeature = (
    feature: Feature<Geometry, NeighborhoodProps>,
    layer: L.Layer,
  ) => {
    const name = feature.properties.name;
    layer.bindTooltip(name, { sticky: true });
    layer.on({
      click: () => setPicked(name),
      mouseover: () => setHovered(name),
      mouseout: () => setHovered(null),
    });
  };

  const confirm = (name: string) =>
    onSelect({ name, address: `${name}, Hartford, CT` });

  const options = useMemo(
    () =>
      data.features
        .map((f) => f.properties.name)
        .sort((a, b) => a.localeCompare(b)),
    [],
  );

  return (
    <div className="space-y-2.5">
      {picked ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground">{picked}</p>
            <p className="truncate text-xs text-muted-foreground">Hartford, CT</p>
          </div>
          <Button type="button" onClick={() => confirm(picked)} className="shrink-0 rounded-full">
            View this neighborhood
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Tap a neighborhood on the map, or use the dropdown below, to select it.
        </p>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Click +/- to zoom · Drag to pan
      </p>

      <div
        role="region"
        aria-label="Map of Hartford neighborhoods. Use the dropdown below to select a neighborhood with the keyboard."
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

      <div className="relative z-[100]">
        <label className="text-xs font-medium text-muted-foreground">
          Or select a neighborhood from the list
        </label>
        <Select value={picked ?? ""} onValueChange={(v) => setPicked(v)}>
          <SelectTrigger className="w-full border-primary text-primary hover:bg-primary/10">
            <SelectValue placeholder="— Choose a neighborhood —" />
          </SelectTrigger>
          <SelectContent className="z-[500]">
            {options.map((name) => (
              <SelectItem
                key={name}
                value={name}
                style={{ color: colorFor(name) }}
                className="font-medium"
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Boundaries: City of Hartford official neighborhood map.
      </p>
    </div>
  );
}
