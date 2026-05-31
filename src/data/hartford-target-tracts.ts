// 19 GREATER HARTFORD BRANCH NAACP target census tracts.
// Note: 7 of the 19 (5006, 5007, 5008, 5011, 5016, 5019, 5020) were renumbered
// or merged in the 2020 Census redistricting and do not have 2020-vintage
// polygons. Only the 12 tracts that survived 2020 redistricting appear on the
// map polygon layer (see hartford-target-tracts.geojson). The full target list
// below is still used to document scope.

export type TargetTract = {
  tract: string; // 6-digit census tract code
  tractName: string;
  neighborhood: string;
  group:
    | "northeast"
    | "blue_hills"
    | "upper_albany"
    | "adjacent"
    | "frog_hollow"
    | "clay_arsenal"
    | "asylum_hill"
    | "west_end"
    | "south_green"
    | "sheldon"
    | "barry_square"
    | "parkville"
    | "other";
  // True if a 2020-vintage polygon is available on the map
  hasPolygon: boolean;
};

export const TARGET_TRACTS: TargetTract[] = [
  // Barry Square
  { tract: "500100", tractName: "5001.00", neighborhood: "Barry Square", group: "barry_square", hasPolygon: true },
  { tract: "500200", tractName: "5002.00", neighborhood: "Barry Square", group: "barry_square", hasPolygon: true },
  // South Green
  { tract: "500300", tractName: "5003.00", neighborhood: "South Green", group: "south_green", hasPolygon: true },
  // Sheldon
  { tract: "500400", tractName: "5004.00", neighborhood: "Sheldon", group: "sheldon", hasPolygon: true },
  // Northeast
  { tract: "500500", tractName: "5005.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "500600", tractName: "5006.00", neighborhood: "Northeast", group: "northeast", hasPolygon: false },
  { tract: "501200", tractName: "5012.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "501300", tractName: "5013.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  { tract: "501500", tractName: "5015.00", neighborhood: "Northeast", group: "northeast", hasPolygon: true },
  // Blue Hills
  { tract: "500700", tractName: "5007.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: false },
  { tract: "500800", tractName: "5008.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: false },
  { tract: "503800", tractName: "5038.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: true },
  { tract: "503900", tractName: "5039.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: true },
  { tract: "504000", tractName: "5040.00", neighborhood: "Blue Hills", group: "blue_hills", hasPolygon: true },
  // Upper Albany
  { tract: "501400", tractName: "5014.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  { tract: "501700", tractName: "5017.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  { tract: "503500", tractName: "5035.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  { tract: "503700", tractName: "5037.00", neighborhood: "Upper Albany", group: "upper_albany", hasPolygon: true },
  // North End adjacent
  { tract: "501100", tractName: "5011.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  { tract: "501600", tractName: "5016.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  { tract: "501900", tractName: "5019.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  { tract: "502000", tractName: "5020.00", neighborhood: "North End Adjacent", group: "adjacent", hasPolygon: false },
  // Clay-Arsenal
  { tract: "500900", tractName: "5009.00", neighborhood: "Clay-Arsenal", group: "clay_arsenal", hasPolygon: true },
  { tract: "501800", tractName: "5018.00", neighborhood: "Clay-Arsenal", group: "clay_arsenal", hasPolygon: true },
  // Asylum Hill
  { tract: "503101", tractName: "5031.01", neighborhood: "Asylum Hill", group: "asylum_hill", hasPolygon: true },
  { tract: "503102", tractName: "5031.02", neighborhood: "Asylum Hill", group: "asylum_hill", hasPolygon: true },
  { tract: "503300", tractName: "5033.00", neighborhood: "Asylum Hill", group: "asylum_hill", hasPolygon: true },
  // Frog Hollow
  { tract: "502800", tractName: "5028.00", neighborhood: "Frog Hollow", group: "frog_hollow", hasPolygon: true },
  { tract: "502900", tractName: "5029.00", neighborhood: "Frog Hollow", group: "frog_hollow", hasPolygon: true },
  { tract: "503000", tractName: "5030.00", neighborhood: "Frog Hollow", group: "frog_hollow", hasPolygon: true },
  // West End
  { tract: "504200", tractName: "5042.00", neighborhood: "West End", group: "west_end", hasPolygon: true },
  // Parkville
  { tract: "504100", tractName: "5041.00", neighborhood: "Parkville", group: "parkville", hasPolygon: true },
  { tract: "504300", tractName: "5043.00", neighborhood: "Parkville", group: "parkville", hasPolygon: true },
];

export const GROUP_COLORS: Record<TargetTract["group"], string> = {
  northeast: "#2563eb",     // blue
  blue_hills: "#0891b2",    // teal
  upper_albany: "#16a34a",  // green
  adjacent: "#d97706",      // amber
  frog_hollow: "#9333ea",   // purple
  clay_arsenal: "#dc2626",  // red
  asylum_hill: "#db2777",   // pink
  west_end: "#0d9488",      // teal-green
  south_green: "#65a30d",   // lime
  sheldon: "#ca8a04",       // yellow-amber
  barry_square: "#7c3aed",  // violet
  parkville: "#ea580c",     // orange
  other: "#94a3b8",         // slate (non-target Hartford tracts)
};

export const GROUP_LABELS: Record<TargetTract["group"], string> = {
  northeast: "Northeast",
  blue_hills: "Blue Hills",
  upper_albany: "Upper Albany",
  adjacent: "North End Adjacent",
  frog_hollow: "Frog Hollow",
  clay_arsenal: "Clay-Arsenal",
  asylum_hill: "Asylum Hill",
  west_end: "West End",
  south_green: "South Green",
  sheldon: "Sheldon",
  barry_square: "Barry Square",
  parkville: "Parkville",
  other: "Other Hartford",
};
