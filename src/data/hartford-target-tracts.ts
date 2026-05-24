// 19 NAACP Greater Hartford target census tracts.
// Note: 7 of the 19 (5006, 5007, 5008, 5011, 5016, 5019, 5020) were renumbered
// or merged in the 2020 Census redistricting and do not have 2020-vintage
// polygons. Only the 12 tracts that survived 2020 redistricting appear on the
// map polygon layer (see hartford-target-tracts.geojson). The full target list
// below is still used to document scope.

export type TargetTract = {
  tract: string; // 6-digit census tract code
  tractName: string;
  neighborhood: string;
  group: "northeast" | "blue_hills" | "upper_albany" | "adjacent" | "other";
  // True if a 2020-vintage polygon is available on the map
  hasPolygon: boolean;
};

export const TARGET_TRACTS: TargetTract[] = [
  // Northeast
  { tract: "500100", tractName: "5001.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "500200", tractName: "5002.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "500300", tractName: "5003.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "500400", tractName: "5004.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "500500", tractName: "5005.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "500600", tractName: "5006.00", neighborhood: "Northeast", group: "northeast", hasPolygon: false },
  // Blue Hills
  { tract: "500700", tractName: "5007.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: false },
  { tract: "500800", tractName: "5008.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: false },
  { tract: "500900", tractName: "5009.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: true },
  // Upper Albany
  { tract: "501200", tractName: "5012.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  { tract: "501300", tractName: "5013.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  { tract: "501400", tractName: "5014.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  { tract: "501500", tractName: "5015.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  // North End adjacent
  { tract: "501100", tractName: "5011.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  { tract: "501600", tractName: "5016.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  { tract: "501700", tractName: "5017.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: true },
  { tract: "501800", tractName: "5018.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: true },
  { tract: "501900", tractName: "5019.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  { tract: "502000", tractName: "5020.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
];

export const GROUP_COLORS: Record<TargetTract["group"], string> = {
  northeast: "#2563eb",     // blue
  blue_hills: "#0891b2",    // teal
  upper_albany: "#16a34a",  // green
  adjacent: "#d97706",      // amber
};

export const GROUP_LABELS: Record<TargetTract["group"], string> = {
  northeast: "Northeast",
  blue_hills: "Blue Hills",
  upper_albany: "Upper Albany",
  adjacent: "North End Adjacent",
};
