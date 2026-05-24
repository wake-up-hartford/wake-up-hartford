import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Wake Up Wednesday" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/plans" });
    });
  }, [nav]);

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/plans",
    });
    if (result.error) setError(result.error.message);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: window.location.origin + "/plans",
          },
        });
        if (error) throw error;
        setError("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/plans" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <Link to="/life" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-display text-3xl text-foreground">
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        Sign in to save your stabilization plan, check off steps, and come back later.
      </p>

      <div className="mt-6 space-y-3">
        <h2 className="font-display text-xl text-foreground">Sign in + Stay Connected</h2>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          We'll send your Action Plan by email. You can also opt-in for updates on free resources and community action you can be part of — NAACP Greater Hartford campaigns working to change the systems that affect your life.
        </p>
        <button
          onClick={() => { setMode("signup"); setError(null); }}
          className="flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-[14px] font-semibold text-white shadow-soft hover:bg-amber-600"
        >
          Create Account
        </button>
        <p className="text-center text-[13px] italic text-muted-foreground">-OR, if returning...</p>
      </div>

      <button
        onClick={handleGoogle}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-secondary/50"
      >
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        {mode === "signup" && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Password must:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Be at least 8 characters long</li>
              <li>Include upper &amp; lowercase letters, a number, and a symbol</li>
              <li>Not be a common or previously leaked password (e.g. "password123")</li>
            </ul>
          </div>
        )}
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft disabled:opacity-50"
        >
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
        className="mt-4 w-full text-center text-[13px] text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </AppShell>
  );
}
