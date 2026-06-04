import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantAdminByEmail, listAdmins, revokeAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({
    meta: [
      { title: "Admins — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAdminsPage,
});

function AdminAdminsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listAdmins);
  const grant = useServerFn(grantAdminByEmail);
  const revoke = useServerFn(revokeAdmin);

  const list = useQuery({ queryKey: ["admin-admins"], queryFn: () => fetchList({}) });

  const [email, setEmail] = useState("");

  const grantMut = useMutation({
    mutationFn: (e: string) => grant({ data: { email: e } }),
    onSuccess: (res) => {
      toast.success(`${res.email} is now an admin`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (userId: string) => revoke({ data: { userId } }),
    onSuccess: () => {
      toast.success("Admin access revoked");
      qc.invalidateQueries({ queryKey: ["admin-admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminLayout title="Admins">
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="text-sm font-medium mb-3">Invite an admin</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) grantMut.mutate(email.trim());
            }}
            className="flex flex-col sm:flex-row gap-2 sm:items-end"
          >
            <div className="flex-1">
              <Label htmlFor="admin-email" className="text-xs">Email address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="person@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={grantMut.isPending}>
              <UserPlus className="h-4 w-4 mr-1" />
              {grantMut.isPending ? "Granting…" : "Grant admin"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            The person must have signed up to the site first. If they haven't, ask them to create an account, then come back here.
          </p>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Admin since</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {list.data && list.data.admins.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No admins yet.</td></tr>
              )}
              {list.data?.admins.map((a) => (
                <tr key={a.userId} className="border-t">
                  <td className="p-2">{a.name}{a.isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</td>
                  <td className="p-2">{a.email || "—"}</td>
                  <td className="p-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={a.isSelf || revokeMut.isPending}
                      onClick={() => {
                        if (confirm(`Revoke admin access for ${a.email || a.name}?`)) {
                          revokeMut.mutate(a.userId);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminLayout>
  );
}
