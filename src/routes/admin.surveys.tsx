import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { listSurveyResponses } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/surveys")({
  head: () => ({
    meta: [
      { title: "Surveys — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSurveysPage,
});

type SurveyRow = {
  id: string;
  user_id: string;
  created_at: string;
  most_used: string;
  ease: number;
  tech_issue: string;
  prompt: string;
  features_used: string[] | null;
  comment: string | null;
};

function AdminSurveysPage() {
  const fetchList = useServerFn(listSurveyResponses);
  const list = useQuery({ queryKey: ["admin-survey-responses"], queryFn: () => fetchList({}) });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mostUsed, setMostUsed] = useState("all");
  const [techIssue, setTechIssue] = useState("all");
  const [promptF, setPromptF] = useState("all");
  const [minEase, setMinEase] = useState("all");

  const rows: SurveyRow[] = (list.data?.responses ?? []) as SurveyRow[];

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (from && new Date(r.created_at) < new Date(from)) return false;
        if (to && new Date(r.created_at) > new Date(to + "T23:59:59")) return false;
        if (mostUsed !== "all" && r.most_used !== mostUsed) return false;
        if (techIssue !== "all" && r.tech_issue !== techIssue) return false;
        if (promptF !== "all" && r.prompt !== promptF) return false;
        if (minEase !== "all" && r.ease < Number(minEase)) return false;
        return true;
      }),
    [rows, from, to, mostUsed, techIssue, promptF, minEase],
  );

  const exportCsv = () => {
    const headers = ["id", "user_id", "created_at", "most_used", "ease", "tech_issue", "prompt", "features_used", "comment"];
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

  return (
    <AdminLayout title="Surveys">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {rows.length} responses
          </p>
          <Button size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>

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
    </AdminLayout>
  );
}
