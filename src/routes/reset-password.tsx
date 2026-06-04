import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Wake Up Wednesday" },
      { name: "description", content: "Reset your Wake Up Wednesday account password." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/reset-password" },
    ],
  }),
  component: ResetPasswordPage,
});

function passwordMeetsRules(p: string) {
  return (
    p.length >= 8 &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /\d/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  );
}

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase puts the recovery token in the URL hash and processes it
  // automatically. We just need to detect a recovery event OR an active session.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecoveryHash = hash.includes("type=recovery");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecoveryHash && session)) {
        setHasRecovery(true);
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isRecoveryHash) setHasRecovery(true);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordMeetsRules(password)) {
      setError("Password must be 8+ characters with upper & lowercase, a number, and a symbol.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("pwned") || msg.includes("compromised") || msg.includes("leaked")) {
          throw new Error("This password has appeared in a known data breach. Please choose a different one.");
        }
        throw error;
      }
      toast.success("Password updated. You're signed in.");
      nav({ to: "/plans" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update your password.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <AppShell>
        <p className="mt-10 text-center text-[14px] text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!hasRecovery) {
    return (
      <AppShell>
        <Link to="/auth" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <h2 className="font-display text-3xl leading-tight text-foreground">Reset link expired</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one from the sign-in page.
        </p>
        <Link
          to="/auth"
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft"
        >
          Go to sign in
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h2 className="font-display text-3xl leading-tight text-foreground">Set a new password</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        Choose a strong password you haven't used elsewhere.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        {password.length > 0 && !passwordMeetsRules(password) && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Password must:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Be at least 8 characters long</li>
              <li>Include upper &amp; lowercase letters, a number, and a symbol</li>
              <li>Not be a common or previously leaked password</li>
            </ul>
          </div>
        )}
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft disabled:opacity-50"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </AppShell>
  );
}
