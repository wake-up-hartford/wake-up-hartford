import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getReportingData } from "@/lib/admin.functions";
import { TARGET_TRACTS } from "@/data/hartford-target-tracts";
import { VETTED_RESOURCES } from "@/data/vetted-resources";

export const Route = createFileRoute("/admin/reporting")({
  head: () => ({
    meta: [
      { title: "Reporting — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminReportingPage,
});

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#06b6d4"];

const LANG_LABEL: Record<string, string> = { en: "English", es: "Español" };

function tractLabel(fips: string): string {
  // Accept either 6-digit tract code or full FIPS
  const short = fips.length >= 6 ? fips.slice(-6) : fips;
  const match = TARGET_TRACTS.find((t) => t.tract === short);
  return match ? `${match.neighborhood} (${match.tractName})` : `Tract ${fips}`;
}

function resourceLabel(id: string): string {
  const r = VETTED_RESOURCES.find((res) => res.name === id || res.url === id);
  return r?.name ?? id;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminReportingPage() {
  const fetchData = useServerFn(getReportingData);
  const q = useQuery({ queryKey: ["admin-reporting"], queryFn: () => fetchData({}) });

  const langData = useMemo(() => {
    if (!q.data) return [];
    return Object.entries(q.data.language).map(([k, v]) => ({ name: LANG_LABEL[k] ?? k, value: v }));
  }, [q.data]);

  const geoTop = useMemo(() => {
    if (!q.data) return [];
    return q.data.geo.slice(0, 12).map((g) => ({ name: tractLabel(g.tract_fips), count: g.count }));
  }, [q.data]);

  const resourcesTop = useMemo(() => {
    if (!q.data) return [];
    return q.data.resources.slice(0, 10).map((r) => ({ name: resourceLabel(r.resource_id), count: r.count }));
  }, [q.data]);

  return (
    <AdminLayout title="Reporting">
      {q.isLoading && <div className="text-muted-foreground">Loading…</div>}
      {q.data && (
        <div className="space-y-6">
          {/* Time series */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Activity — last 90 days</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadCsv("activity-90d.csv", q.data.series)}
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={q.data.series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="signups" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="intakes" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="plans" stroke={COLORS[2]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="stepsCompleted" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {q.data.series.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">No activity in the last 90 days.</div>
            )}
          </Card>

          {/* Geographic */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Geographic — intake by census tract</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    "geo.csv",
                    q.data.geo.map((g) => ({ tract_fips: g.tract_fips, neighborhood: tractLabel(g.tract_fips), count: g.count })),
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
            {geoTop.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No tract data yet.</div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geoTop} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={180} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Language & accessibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="text-sm font-medium mb-3">Language preference</h2>
              {langData.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">No data yet.</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={langData} dataKey="value" nameKey="name" outerRadius={80} label>
                        {langData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-medium mb-3">SMS alerts opt-in</h2>
              <div className="text-3xl font-semibold">
                {q.data.smsOptIn}
                <span className="text-base text-muted-foreground font-normal">
                  {" "}
                  / {q.data.totalProfiles}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {q.data.totalProfiles
                  ? `${Math.round((q.data.smsOptIn / q.data.totalProfiles) * 100)}% of users`
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Listen (TTS) and per-resource click tracking aren't logged yet — let me know to add instrumentation.
              </p>
            </Card>
          </div>

          {/* Resource engagement */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Top resources in generated plans</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    "resources.csv",
                    q.data.resources.map((r) => ({ resource_id: r.resource_id, name: resourceLabel(r.resource_id), count: r.count })),
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
            {resourcesTop.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No resource references yet.</div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourcesTop} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={220} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
