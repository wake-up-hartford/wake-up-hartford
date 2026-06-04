import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, ReactNode } from "react";
import { BarChart3, LayoutDashboard, ShieldAlert, Users, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { checkIsAdmin } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

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
            Your account doesn't have admin access.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-border mb-4 -mx-1 px-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                  active
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </AppShell>
  );
}
