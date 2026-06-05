import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, ReactNode } from "react";
import { BarChart3, LayoutDashboard, ShieldAlert, Users, ClipboardList, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { checkIsAdmin } from "@/lib/admin.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV: ReadonlyArray<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/reporting", label: "Reporting", icon: BarChart3 },
  { to: "/admin/surveys", label: "Surveys", icon: ClipboardList },
  { to: "/admin/admins", label: "Admins", icon: Users },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const checkAdmin = useServerFn(checkIsAdmin);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkAdmin({}),
    enabled: !!user,
  });

  if (loading || admin.isLoading) {
    return (
      <AppShell>
        <div className="p-6 text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (admin.data && !admin.data.isAdmin) {
    return (
      <AppShell>
        <div className="p-6 max-w-md mx-auto text-center space-y-3">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn&apos;t have admin access.
          </p>
        </div>
      </AppShell>
    );
  }

  const activeItem = NAV.find((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to)
  );

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-border" />
          <Select
            value={activeItem?.to ?? "/admin"}
            onValueChange={(value) => nav({ to: value })}
          >
            <SelectTrigger className="w-[200px] border-border bg-background">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <SelectItem key={item.to} value={item.to}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <h1 className="text-xl font-semibold mb-4">{title}</h1>
        {children}
      </div>
    </AppShell>
  );
}

