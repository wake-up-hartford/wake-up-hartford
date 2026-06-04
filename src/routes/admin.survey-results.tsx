import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { checkIsAdmin, getUsageStats, listSurveyResponses } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/survey-results")({
  head: () => ({
    meta: [
      { title: "Survey Results — Admin" },
      { name: "description", content: "Admin dashboard for Wake Up Wednesday survey responses." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/admin/survey-results" },
    ],
  }),
  component: AdminSurveyResultsPage,
});

type SurveyRow = {
  id: string;
  user_id: string;
  created_at: string;
  most_used: string;
  ease: number;
  tech_issue: string;
  prompt: string;
  feature_awareness: string | null;
  comment: string | null;
};

function AdminSurveyResultsPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const checkAdmin = useServerFn(checkIsAdmin);
  const fetchList = useServerFn(listSurveyResponses);
  const fetchStats = useServerFn(getUsageStats);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkAdmin({}),
    enabled: !!user,
  });

  const list = useQuery({
    queryKey: ["admin-survey-responses"],
    queryFn: () => fetchList({}),
    enabled: !!user && admin.data?.isAdmin === true,
  });

  const stats = useQuery({
    queryKey: ["admin-usage-stats"],
    queryFn: () => fetchStats({}),
    enabled: !!user && admin.data?.isAdmin === true,
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mostUsed, setMostUsed] = useState("all");
  const [techIssue, setTechIssue] = useState("all");
  const [promptF, setPromptF] = useState("all");
  const [minEase, setMinEase] = useState("all");

  const rows: SurveyRow[] = (list.data?.responses ?? []) as SurveyRow[];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && new Date(r.created_at) < new Date(from)) return false;
      if (to && new Date(r.created_at) > new Date(to + "T23:59:59")) return false;
      if (mostUsed !== "all" && r.most_used !== mostUsed) return false;
      if (techIssue !== "all" && r.tech_issue !== techIssue) return false;
      if (promptF !== "all" && r.prompt !== promptF) return false;
      if (minEase !== "all" && r.ease < Number(minEase)) return false;
      return true;
    });
  }, [rows, from, to, mostUsed, techIssue, promptF, minEase]);

  const exportCsv = () => {
    const headers = ["id", "user_id", "created_at", "most_used", "ease", "tech_issue", "prompt", "feature_awareness", "comment"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...filtered.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || admin.isLoading) {
    return <AppShell><div className="p-6 text-muted-foreground">Loading…</div></AppShell>;
  }

  if (admin.data && !admin.data.isAdmin) {
    return (
      <AppShell>
        <div className="p-6 max-w-md mx-auto text-center space-y-3">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn't have admin access to view survey results.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold">Survey results</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {rows.length} responses
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportJson}>
              <Download className="h-4 w-4 mr-1" /> JSON
            </Button>
            <Button size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {stats.data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Users" value={stats.data.totals.users} sub={`+${stats.data.recent.newUsers7d} last 7d`} />
              <StatCard label="Intake responses" value={stats.data.totals.intakeResponses} sub={`+${stats.data.recent.intake7d} last 7d`} />
              <StatCard label="Plans generated" value={stats.data.totals.plansGenerated} sub={`${stats.data.totals.activePlans} active`} />
              <StatCard
                label="Step completion"
                value={`${Math.round(stats.data.totals.stepCompletionRate * 100)}%`}
                sub={`${stats.data.totals.completedSteps}/${stats.data.totals.totalSteps}`}
              />
              <StatCard
                label="App survey"
                value={stats.data.totals.appSurveyResponses}
                sub={`${stats.data.totals.uniqueAppRespondents} unique`}
              />
              <StatCard
                label="Avg helpfulness"
                value={stats.data.totals.avgHelpfulness != null ? stats.data.totals.avgHelpfulness.toFixed(1) : "—"}
                sub={`${stats.data.totals.progressSurveys} progress surveys`}
              />
            </div>

            {(Object.keys(stats.data.progressCounts).length > 0 || Object.keys(stats.data.barrierCounts).length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BreakdownCard title="Progress" counts={stats.data.progressCounts} />
                <BreakdownCard title="Top barriers" counts={stats.data.barrierCounts} />
              </div>
            )}

            <FunnelCard steps={stats.data.funnel} />
          </>
        )}


        <Card className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Most used</Label>
            <Select value={mostUsed} onValueChange={setMostUsed}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="path">Path</SelectItem>
                <SelectItem value="find_help">Find help</SelectItem>
                <SelectItem value="take_action">Take action</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tech issue</Label>
            <Select value={techIssue} onValueChange={setTechIssue}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
                <SelectItem value="errors">Errors</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prompt</Label>
            <Select value={promptF} onValueChange={setPromptF}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="search">Search</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Min ease</Label>
            <Select value={minEase} onValueChange={setMinEase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Ease</th>
                <th className="p-2">Most used</th>
                <th className="p-2">Tech issue</th>
                <th className="p-2">Prompt</th>
                <th className="p-2">Awareness</th>
                <th className="p-2">Comment</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!list.isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No responses match.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{r.ease}</td>
                  <td className="p-2">{r.most_used}</td>
                  <td className="p-2">{r.tech_issue}</td>
                  <td className="p-2">{r.prompt}</td>
                  <td className="p-2">{r.feature_awareness ?? "—"}</td>
                  <td className="p-2 max-w-[24rem] truncate" title={r.comment ?? ""}>{r.comment ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

function BreakdownCard({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, n]) => a + n, 0);
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1.5">
        {entries.map(([k, n]) => (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span className="truncate">{k}</span>
              <span className="text-muted-foreground">{n}</span>
            </div>
            <div className="h-1.5 bg-muted rounded">
              <div className="h-full bg-primary rounded" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
        {entries.length === 0 && <div className="text-sm text-muted-foreground">No data yet.</div>}
      </div>
    </Card>
  );
}

function FunnelCard({ steps }: { steps: Array<{ label: string; count: number }> }) {
  const top = steps[0]?.count ?? 0;
  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-3">Conversion funnel</div>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const widthPct = top ? (s.count / top) * 100 : 0;
          const prev = i > 0 ? steps[i - 1].count : null;
          const stepPct = prev && prev > 0 ? (s.count / prev) * 100 : null;
          const dropoff = prev != null ? prev - s.count : null;
          return (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">
                  {s.count}
                  {stepPct != null && (
                    <span className="ml-2">
                      {stepPct.toFixed(0)}%{dropoff && dropoff > 0 ? ` (-${dropoff})` : ""}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary rounded transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
