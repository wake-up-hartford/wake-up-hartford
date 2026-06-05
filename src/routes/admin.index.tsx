import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { checkIsAdmin, deleteUser, getUsageStats, listSignedUpUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const fetchStats = useServerFn(getUsageStats);
  const stats = useQuery({
    queryKey: ["admin-usage-stats"],
    queryFn: () => fetchStats({}),
  });

  return (
    <AdminLayout title="Overview">
      {stats.isLoading && <div className="text-muted-foreground">Loading…</div>}
      {stats.data && (
        <div className="space-y-4">
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
          <UsersListCard />
          <FunnelInsightsCard />
        </div>
      )}
    </AdminLayout>
  );
}

function UsersListCard() {
  const fetchUsers = useServerFn(listSignedUpUsers);
  const fetchIsAdmin = useServerFn(checkIsAdmin);
  const removeUser = useServerFn(deleteUser);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin-signed-up-users"],
    queryFn: () => fetchUsers({}),
  });
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => fetchIsAdmin({}),
  });

  const del = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-signed-up-users"] });
      qc.invalidateQueries({ queryKey: ["admin-usage-stats"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't delete user."),
  });

  const meId = me.data?.userId;

  const handleDelete = (id: string, label: string) => {
    if (!confirm(`Permanently delete ${label}? This removes their account and all related data.`)) return;
    del.mutate(id);
  };

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-medium">Signed-up users</div>
        <div className="text-xs text-muted-foreground">
          {q.data ? `${q.data.users.length} total` : ""}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Most recent sign-ups first. Scroll for more. Deleting a user is permanent.
      </p>
      {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {q.error && (
        <div className="text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : "Couldn't load users."}
        </div>
      )}
      {q.data && q.data.users.length === 0 && (
        <div className="text-sm text-muted-foreground">No users yet.</div>
      )}
      {q.data && q.data.users.length > 0 && (
        <div className="max-h-80 overflow-y-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">Name</th>
                <th className="text-left font-medium px-3 py-2">Email</th>
                <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Joined</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {q.data.users.map((u) => {
                const isSelf = meId === u.id;
                const label = u.email || u.name || u.id;
                const isPending = del.isPending && del.variables === u.id;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[260px]">{u.email || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isSelf || isPending}
                        onClick={() => handleDelete(u.id, label)}
                        title={isSelf ? "You can't delete your own account" : "Delete user"}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isPending ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-3 text-center">
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
      <div className="text-sm font-medium mb-1">Conversion funnel</div>
      <p className="text-xs text-muted-foreground mb-3">
        Shows how many users move through each stage — from sign-up to completing plan steps. Use this to spot drop-off points.
      </p>
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
                <div className="h-full bg-primary rounded transition-all" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function FunnelInsightsCard() {
  const insights = [
    {
      stage: "Sign up → Address",
      reasons: [
        "Users don't see value before being asked for personal info.",
        "Sign-up form feels too long or asks for too much upfront.",
        "No clear explanation of what happens next.",
      ],
      fixes: [
        "Add a brief 'What to expect' preview before sign-up.",
        "Allow browsing the platform before requiring an address.",
        "Reduce sign-up fields to the absolute minimum (email + password).",
      ],
    },
    {
      stage: "Address → Intake completed",
      reasons: [
        "Intake survey is long or repetitive.",
        "Users aren't sure why the questions matter.",
        "Technical issues or confusion about tract selection.",
      ],
      fixes: [
        "Show progress bar and estimated time to complete.",
        "Explain how answers shape their personalized plan.",
        "Add tooltips or examples for census tract lookup.",
      ],
    },
    {
      stage: "Intake → Plan generated",
      reasons: [
        "Users don't understand what a 'plan' is or why it helps.",
        "The generate step feels like a dead end or takes too long.",
        "Users want to explore resources before committing to a plan.",
      ],
      fixes: [
        "Add a short explainer: 'We'll build a step-by-step action plan for you.'",
        "Show a loading state with helpful tips while the plan generates.",
        "Offer a 'Browse resources' option alongside plan generation.",
      ],
    },
    {
      stage: "Plan generated → Steps completed",
      reasons: [
        "Steps feel overwhelming or not actionable enough.",
        "Users lose motivation without reminders or check-ins.",
        "Barriers (childcare, transport, documentation) block progress.",
      ],
      fixes: [
        "Break steps into smaller, concrete micro-actions.",
        "Enable SMS/email reminders for upcoming steps.",
        "Surface local support resources for common barriers.",
      ],
    },
  ];

  return (
    <Card className="p-4">
      <div className="text-sm font-medium mb-1">Why drop-off happens</div>
      <p className="text-xs text-muted-foreground mb-3">
        Common reasons users leave at each stage and suggested fixes. Prioritize the stages with the biggest gaps above.
      </p>
      <div className="space-y-4">
        {insights.map((item) => (
          <div key={item.stage}>
            <div className="text-xs font-semibold text-primary mb-1.5">{item.stage}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Likely reasons</div>
                <ul className="space-y-1">
                  {item.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1">Suggested fixes</div>
                <ul className="space-y-1">
                  {item.fixes.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['→'] before:absolute before:left-0 before:text-primary">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
