import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Wake Up Wednesday" }] }),
  component: AuthPage,
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

// Map raw Supabase auth errors to plain-language messages.
function friendlyAuthError(err: unknown, context: "signin" | "signup" | "reset" | "resend"): string {
  const e = err as { code?: string; message?: string } | null;
  const msg = (e?.message || "").toLowerCase();
  const code = e?.code || "";

  // HIBP / leaked password
  if (
    code === "weak_password" &&
    (msg.includes("pwned") || msg.includes("compromised") || msg.includes("data breach") || msg.includes("leaked"))
  ) {
    return "This password has appeared in a known data breach. Please choose a different one.";
  }
  if (code === "weak_password" || msg.includes("password should")) {
    return "That password doesn't meet the requirements. Use 8+ characters with upper & lowercase, a number, and a symbol.";
  }
  if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("user already")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (code === "invalid_credentials" || msg.includes("invalid login")) {
    return "Email or password is incorrect.";
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network issue. Check your connection and try again.";
  }
  // Fallback
  if (context === "signup") return e?.message || "Couldn't create your account. Please try again.";
  if (context === "reset") return e?.message || "Couldn't send the reset link. Please try again.";
  if (context === "resend") return e?.message || "Couldn't resend the email. Please try again.";
  return e?.message || "Something went wrong. Please try again.";
}

type View = "signin" | "signup" | "forgot" | "pending";

function AuthPage() {
  const nav = useNavigate();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/plans" });
    });
  }, [nav]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

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
      if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name || email.split("@")[0],
              phone: phone || null,
              opt_in_updates: optIn,
            },
            emailRedirectTo: window.location.origin + "/plans",
          },
        });
        if (error) throw error;
        setPendingEmail(email);
        setView("pending");
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/plans" });
      }
    } catch (err) {
      setError(friendlyAuthError(err, view === "signup" ? "signup" : "signin"));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      toast.success("Reset link sent. Check your email.");
      setView("signin");
    } catch (err) {
      setError(friendlyAuthError(err, "reset"));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
      if (error) throw error;
      toast.success("Confirmation email resent.");
      setResendCooldown(30);
    } catch (err) {
      toast.error(friendlyAuthError(err, "resend"));
    } finally {
      setBusy(false);
    }
  };

  const showPwHelp =
    view === "signup" && password.length > 0 && !passwordMeetsRules(password);

  // ===== Pending (check your email) =====
  if (view === "pending") {
    return (
      <AppShell>
        <Link to="/life" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <MailCheck className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl leading-tight text-foreground">Check your email</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            We sent a confirmation link to
          </p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{pendingEmail}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Click the link in that email to activate your account, then come back here to sign in.
          </p>

          <button
            onClick={handleResend}
            disabled={busy || resendCooldown > 0}
            className="mt-6 w-full rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-secondary/50 disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend confirmation email"}
          </button>

          <button
            onClick={() => { setView("signup"); setError(null); }}
            className="mt-3 text-[13px] text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
          <button
            onClick={() => { setView("signin"); setError(null); }}
            className="mt-2 text-[13px] text-muted-foreground hover:text-foreground"
          >
            I already confirmed — sign in
          </button>
        </div>
      </AppShell>
    );
  }

  // ===== Forgot password =====
  if (view === "forgot") {
    return (
      <AppShell>
        <button
          onClick={() => { setView("signin"); setError(null); }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to sign in
        </button>
        <h2 className="font-display text-3xl leading-tight text-foreground">Reset your password</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Enter the email for your account and we'll send you a link to set a new password.
        </p>
        <form onSubmit={handleForgot} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
          />
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </AppShell>
    );
  }

  // ===== Sign in / Sign up =====
  return (
    <AppShell>
      <Link to="/life" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-6 space-y-3">
        <h2 className="font-display text-3xl leading-tight text-foreground">Sign in + Stay Connected</h2>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          We'll send your Action Plan by email. You can also opt-in for updates on free resources and community action you can be part of — GREATER HARTFORD BRANCH NAACP campaigns working to change the systems that affect your life.
        </p>
        <button
          onClick={() => { setView("signup"); setError(null); }}
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
        {view === "signup" && (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Cell phone (optional, for text alerts & plan link)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
            />
          </>
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
        {showPwHelp && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Password must:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Be at least 8 characters long</li>
              <li>Include upper &amp; lowercase letters, a number, and a symbol</li>
              <li>Not be a common or previously leaked password (e.g. "password123")</li>
            </ul>
          </div>
        )}
        {view === "signup" && (
          <label className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-amber-500"
            />
            <span>
              Send me info on free resources and GREATER HARTFORD BRANCH NAACP campaign updates.
            </span>
          </label>
        )}
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft disabled:opacity-50"
        >
          {busy ? "Working…" : view === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {view === "signin" && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => { setView("forgot"); setError(null); }}
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
          <button
            onClick={() => { setView("signup"); setError(null); }}
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            New here? Create an account
          </button>
        </div>
      )}
      {view === "signup" && (
        <button
          onClick={() => { setView("signin"); setError(null); }}
          className="mt-4 w-full text-center text-[13px] text-muted-foreground hover:text-foreground"
        >
          Already have an account? Sign in
        </button>
      )}
    </AppShell>
  );
}
