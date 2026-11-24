// Nightly refresh of Your Home's city data from Hartford's open data
// (data.hartford.gov). Run by .github/workflows/refresh-city-data.yml.
//
//   bun scripts/refresh-city-data.ts            download, check, swap in
//   bun scripts/refresh-city-data.ts --dry-run  download and check only
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (not for --dry-run).
//
// 1. Downloads the city's code enforcement cases (2020 to now) and its 311
//    requests for the current and previous year.
// 2. Checks every page arrived, then loads the records into holding tables.
// 3. Calls apply_city_refresh() in the database, which checks the counts and
//    swaps everything in at once. If anything fails, nothing changes.

import { normalizeAddress } from "../src/lib/normalize-address";

const CODE_ENFORCEMENT =
  "https://utility.arcgis.com/usrsvcs/servers/7cf59bd708a94395be61954d6f430e3f/rest/services/HartfordOpenDataTables/FeatureServer/1";
const SERVICE_REQUESTS =
  "https://utility.arcgis.com/usrsvcs/servers/2185af186dda46caa1e59323407d1daf/rest/services/Service_Requests_2015_to_Current/FeatureServer";
const PAGE_SIZE = 2000;
const INSERT_BATCH = 1000;
const RETRY_WAITS_MS = [30_000, 120_000];

const dryRun = process.argv.includes("--dry-run");

type Attrs = Record<string, string | number | null>;

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(120_000) });
      const text = await res.text();
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        // A 4xx (other than 429, too many requests) won't fix itself, so don't wait and retry.
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          (error as Error & { permanent?: boolean }).permanent = true;
        }
        throw error;
      }
      const json = text ? JSON.parse(text) : null;
      // ArcGIS reports some failures as HTTP 200 with an "error" object.
      if (json && typeof json === "object" && "error" in json && json.error) {
        throw new Error(`Service error: ${JSON.stringify(json.error).slice(0, 300)}`);
      }
      return json;
    } catch (err) {
      if ((err as Error & { permanent?: boolean }).permanent || attempt >= RETRY_WAITS_MS.length) throw err;
      log(`Request failed (${(err as Error).message}); retrying in ${RETRY_WAITS_MS[attempt] / 1000}s`);
      await new Promise((r) => setTimeout(r, RETRY_WAITS_MS[attempt]));
    }
  }
}

// Downloads every record of one layer, page by page, and checks none are missing.
async function downloadLayer(layerUrl: string, outFields: string[], label: string): Promise<Attrs[]> {
  const { count } = await fetchJson(`${layerUrl}/query?where=1%3D1&returnCountOnly=true&f=json`);
  const rows: Attrs[] = [];
  for (let offset = 0; offset < count; offset += PAGE_SIZE) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: ["OBJECTID", ...outFields].join(","),
      orderByFields: "OBJECTID",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      returnGeometry: "false",
      f: "json",
    });
    const page = await fetchJson(`${layerUrl}/query?${params}`);
    for (const f of page.features ?? []) rows.push(f.attributes);
  }
  if (rows.length !== count) {
    throw new Error(`${label}: downloaded ${rows.length} records but the city reports ${count}`);
  }
  log(`${label}: ${rows.length} records`);
  return rows;
}

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const isoDate = (v: unknown) => {
  const s = text(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

// The city keeps one 311 layer per year plus "Service Request Current Year".
async function find311Layers(): Promise<{ url: string; name: string }[]> {
  const service = await fetchJson(`${SERVICE_REQUESTS}?f=json`);
  const layers: { id: number; name: string }[] = [...(service.layers ?? []), ...(service.tables ?? [])];
  const year = Number(new Date().toLocaleString("en-US", { timeZone: "America/New_York", year: "numeric" }));
  const current = layers.find((l) => l.name === "Service Request Current Year");
  if (!current) throw new Error('No "Service Request Current Year" layer found');
  // Last year's layer keeps 12-month counts complete, and catches late records
  // after the city rolls its current-year file over in January.
  const previous = layers.find((l) => l.name.startsWith(`Service Request ${year - 1}0101`));
  if (!previous) log(`No layer for ${year - 1} yet; using the current-year layer only`);
  return [current, previous]
    .filter((l): l is { id: number; name: string } => !!l)
    .map((l) => ({ url: `${SERVICE_REQUESTS}/${l.id}`, name: l.name }));
}

async function supabase(path: string, body: unknown, prefer = "return=minimal") {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return fetchJson(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
}

async function insertInBatches(table: string, rows: object[]) {
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    await supabase(table, rows.slice(i, i + INSERT_BATCH));
  }
  log(`Loaded ${rows.length} rows into ${table}`);
}

async function main() {
  log(dryRun ? "Dry run: downloading and checking only" : "Refreshing city data");

  // Code enforcement: one file, 2020 to now.
  const caseRows = await downloadLayer(
    CODE_ENFORCEMENT,
    ["Case_Number", "ParcelID", "Address", "Record_Name", "Record_Type", "Record_Status",
     "Date_Opened", "Date_Closed", "Property_Owner", "Dept_Division"],
    "Code enforcement",
  );
  const violations = caseRows.flatMap((r) => {
    const norm = normalizeAddress(text(r.Address) ?? "");
    if (!norm) return [];
    const division = text(r.Dept_Division);
    const name = text(r.Record_Name) ?? text(r.Record_Type);
    return [{
      norm_address: norm,
      case_number: text(r.Case_Number),
      // Same description the original load used: record name (or type) and division.
      description: name ? (division ? `${name} — ${division}` : name) : null,
      status: text(r.Record_Status),
      opened_at: isoDate(r.Date_Opened),
      closed_at: isoDate(r.Date_Closed),
      dept_division: division,
      record_type: text(r.Record_Type),
      parcel_id: text(r.ParcelID),
      owner_name: text(r.Property_Owner),
    }];
  });

  // 311: current year plus last year. The current-year file wins any overlap.
  const requests = new Map<string, object>();
  let requestsWithoutAddress = 0;
  let requestsDownloaded = 0;
  const layers = await find311Layers();
  for (const layer of layers.reverse()) {
    const rows = await downloadLayer(
      layer.url,
      ["USER_Record_Number", "USER_Application_Name", "USER_Record_Status", "USER_Opened_Date",
       "USER_Address", "USER_ParcelID", "USER_Dept_Division"],
      layer.name,
    );
    requestsDownloaded += rows.length;
    for (const r of rows) {
      const number = text(r.USER_Record_Number);
      const norm = normalizeAddress(text(r.USER_Address) ?? "");
      if (!number || !norm) {
        requestsWithoutAddress++;
        continue;
      }
      requests.set(number, {
        norm_address: norm,
        request_number: number,
        // Same category the original load used.
        type: text(r.USER_Application_Name),
        status: text(r.USER_Record_Status),
        department: text(r.USER_Dept_Division),
        opened_at: isoDate(r.USER_Opened_Date),
        parcel_id: text(r.USER_ParcelID),
      });
    }
  }
  const complaints = [...requests.values()];

  const newest = (dates: (string | null)[]) => dates.filter(Boolean).sort().at(-1) ?? "none";
  log(`Ready: ${violations.length} code violations (newest ${newest(violations.map((v) => v.opened_at))}), ` +
    `${complaints.length} 311 requests (newest ${newest(complaints.map((c: any) => c.opened_at))})`);
  log(`Skipped for having no usable address: ${caseRows.length - violations.length} code enforcement records, ` +
    `${requestsWithoutAddress} 311 requests`);
  log(`311 requests listed in both yearly files: ${requestsDownloaded - requestsWithoutAddress - complaints.length}`);

  if (dryRun) {
    log("Dry run finished; nothing was written");
    return;
  }

  await supabase("rpc/start_city_refresh", {});
  await insertInBatches("city_refresh_violations", violations);
  await insertInBatches("city_refresh_311", complaints);
  const result = await supabase(
    "rpc/apply_city_refresh",
    { expected_violations: violations.length, expected_311: complaints.length },
    "return=representation",
  );
  log(`Applied: ${JSON.stringify(result)}`);
}

main().catch(async (err) => {
  console.error(`Refresh failed; the site keeps its last good copy. ${(err as Error).message}`);
  if (!dryRun) {
    // Best effort: record the failure so the team can see it in the database.
    try {
      await supabase("city_refresh_runs", { outcome: "failed", detail: { error: String((err as Error).message).slice(0, 1000) } });
    } catch {
      // The failure is already in the job's log.
    }
  }
  process.exit(1);
});
