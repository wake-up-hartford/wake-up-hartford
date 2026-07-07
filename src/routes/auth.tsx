import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Wake Up Wednesday" },
      { name: "description", content: "Sign in or create an account on Wake Up Wednesday." },
      { property: "og:title", content: "Sign in — Wake Up Wednesday" },
      { property: "og:description", content: "Sign in or create an account on Wake Up Wednesday." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/auth" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/auth" },
    ],
  }),
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

  // HIBP / leaked password — Supabase often returns code "weak_password" with a
  // message mentioning "pwned", "compromised", "data breach", or "leaked".
  if (
    msg.includes("pwned") || msg.includes("compromised") ||
    msg.includes("data breach") || msg.includes("leaked")
  ) {
    return "This password has appeared in a known data breach. Please choose a different one.";
  }
  // Only show the strength-rules message when we're confident the rules were the issue.
  if (
    code === "weak_password" ||
    msg.includes("password should contain") ||
    msg.includes("password is too short") ||
    msg.includes("password must")
  ) {
    return "That password doesn't meet the requirements. Use 8+ characters with upper & lowercase, a number, and a symbol. If it already does, the password may have been flagged as compromised — try a different one.";
  }
  if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("user already")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (code === "phone_exists" || (msg.includes("phone") && (msg.includes("already") || msg.includes("exists") || msg.includes("registered")))) {
    return "That phone number is already linked to another account. Leave the phone field blank or use a different number.";
  }
  if (code === "email_exists") {
    return "That email is already registered. Try signing in instead.";
  }
  if (code === "invalid_credentials" || msg.includes("invalid login")) {
    return "Email or password is incorrect.";
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (code === "validation_failed" || msg.includes("invalid")) {
    return e?.message || "One of the fields is invalid. Please double-check and try again.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network issue. Check your connection and try again.";
  }
  // Fallback — surface the raw Supabase message so the user sees the real cause.
  if (context === "signup") return e?.message || "Couldn't create your account. Please try again.";
  if (context === "reset") return e?.message || "Couldn't send the reset link. Please try again.";
  if (context === "resend") return e?.message || "Couldn't resend the email. Please try again.";
  return e?.message || "Something went wrong. Please try again.";
}

type View = "choose" | "signin" | "signup" | "forgot" | "pending";

function AuthPage() {
  const nav = useNavigate();
  const [view, setView] = useState<View>("choose");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const ALLOWED_POST_AUTH_PATHS = ["/life", "/plans", "/dashboard"];

  const isValidPostAuthRedirect = (target: string | null): target is string => {
    if (!target) return false;
    return ALLOWED_POST_AUTH_PATHS.includes(target) || /^\/plan\/[a-f0-9-]+$/i.test(target);
  };

  const consumePostAuthRedirect = (): string => {
    if (typeof window === "undefined") return "/dashboard";
    const target = window.localStorage.getItem("wuw:postAuthRedirect");
    if (isValidPostAuthRedirect(target)) {
      window.localStorage.removeItem("wuw:postAuthRedirect");
      return target;
    }
    return "/dashboard";
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't redirect anonymous users — they're here specifically to upgrade.
      if (session && !session.user.is_anonymous) nav({ to: consumePostAuthRedirect(), replace: true });
    });
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user && !data.user.is_anonymous) nav({ to: consumePostAuthRedirect(), replace: true });
    });
    return () => subscription.unsubscribe();
  }, [nav]);


  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const peekPostAuthRedirect = (): string => {
    if (typeof window === "undefined") return "/dashboard";
    const target = window.localStorage.getItem("wuw:postAuthRedirect");
    if (isValidPostAuthRedirect(target)) return target;
    return "/dashboard";
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + peekPostAuthRedirect(),
    });
    if (result.error) setError(result.error.message);
  };


  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (view === "signup") {
        if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
          setError("The two email addresses don't match. Please re-enter.");
          setBusy(false);
          return;
        }

        // If the visitor has an anonymous session (from the survey), upgrade
        // it in place so their plan stays attached to the same account.
        const { data: sessionData } = await supabase.auth.getSession();
        const anonSession = sessionData.session;
        const isAnon = !!anonSession?.user?.is_anonymous;

        if (isAnon) {
          const { error: updErr } = await supabase.auth.updateUser({
            email,
            password,
            data: {
              first_name: firstName || null,
              last_name: lastName || null,
              phone: phone || null,
              opt_in_updates: optIn,
              sms_alerts: smsOptIn && !!phone.trim(),
            },
          });
          if (updErr) throw updErr;
          setPendingEmail(email);
          setView("pending");
          setPassword("");
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: firstName || null,
                last_name: lastName || null,
                phone: phone || null,
                opt_in_updates: optIn,
                sms_alerts: smsOptIn && !!phone.trim(),
              },
              emailRedirectTo: window.location.origin + peekPostAuthRedirect(),
            },
          });
          if (error) throw error;
          setPendingEmail(email);
          setView("pending");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: consumePostAuthRedirect(), replace: true });
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
        <button
          onClick={() => {
            const target = peekPostAuthRedirect();
            nav({ to: target });
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl leading-tight text-foreground">Check your email</h1>
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
            className="mt-6 w-full rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white disabled:opacity-50"
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
        <h1 className="font-display text-3xl leading-tight text-foreground">Reset your password</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Enter the email for your account and we'll send you a link to set a new password.
        </p>
        <form onSubmit={handleForgot} className="mt-5 space-y-3">
          <label htmlFor="forgot-email" className="sr-only">Email</label>
          <input
            id="forgot-email"
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

  // ===== Choose: Create Account vs Sign In =====
  if (view === "choose") {
    return (
      <AppShell>
        <button
          onClick={() => {
            const target = peekPostAuthRedirect();
            nav({ to: target });
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="mt-6 space-y-3">
          <h1 className="font-display text-3xl leading-tight text-foreground">Sign In</h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Your email connects you to free help and to a movement that's changing what's possible in Hartford.
          </p>
          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-amber-500"
              />
              <span>Send me free resources and updates.</span>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => { setView("signup"); setError(null); }}
            className="flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-[15px] font-semibold text-white shadow-soft hover:bg-amber-600"
          >
            Sign up with Google or email
          </button>
          <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <button
            onClick={() => { setView("signin"); setError(null); }}
            className="flex w-full items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-[15px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white disabled:opacity-50"
          >
            Already Registered? Sign In
          </button>
          <button
            onClick={() => nav({ to: "/dashboard" })}
            className="flex w-full items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-[15px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white disabled:opacity-50"
          >
            Explore without creating an account
          </button>
        </div>
      </AppShell>
    );
  }

  // ===== Sign in =====
  if (view === "signin") {
    return (
      <AppShell>
        <button
          onClick={() => { setView("choose"); setError(null); }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-display text-3xl leading-tight text-foreground">Sign in</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Welcome back. Use Google or the email and password you signed up with.
        </p>

        <button
          onClick={handleGoogle}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <label htmlFor="signin-email" className="sr-only">Email</label>
          <input
            id="signin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
          />
          <label htmlFor="signin-password" className="sr-only">Password</label>
          <input
            id="signin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
          />
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft disabled:opacity-50"
          >
            {busy ? "Working…" : "Sign in"}
          </button>
        </form>

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
      </AppShell>
    );
  }

  // ===== Sign up =====
  return (
    <AppShell>
      <button
        onClick={() => { setView("choose"); setError(null); }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-3xl leading-tight text-foreground">Create your account</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        Sign up with Google for one-tap access, or create an account with your email and a password.
      </p>

      <button
        onClick={handleGoogle}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground shadow-soft hover:bg-amber-500 hover:text-white"
      >
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or sign up with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-first" className="sr-only">First name</label>
            <input
              id="signup-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name (optional)"
              autoComplete="given-name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
            />
          </div>
          <div>
            <label htmlFor="signup-last" className="sr-only">Last name</label>
            <input
              id="signup-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name (optional)"
              autoComplete="family-name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
            />
          </div>
        </div>
        <label htmlFor="signup-phone" className="sr-only">Cell phone</label>
        <input
          id="signup-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Cell phone (optional)"
          autoComplete="tel"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        <label htmlFor="signup-email" className="sr-only">Email</label>
        <input
          id="signup-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        <label htmlFor="signup-email-confirm" className="sr-only">Confirm email</label>
        <input
          id="signup-email-confirm"
          type="email"
          required
          value={emailConfirm}
          onChange={(e) => setEmailConfirm(e.target.value)}
          onPaste={(e) => { e.preventDefault(); setError("Please retype your email to confirm it."); }}
          placeholder="Confirm email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
        />
        <label htmlFor="signup-password" className="sr-only">Password</label>
        <input
          id="signup-password"
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
        <label className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-amber-500"
          />
          <span>
            Send me info on free resources and Greater Hartford Branch NAACP campaign updates.
          </span>
        </label>
        <label className={`flex items-start gap-2 text-[13px] leading-snug ${phone.trim() ? "text-foreground" : "text-muted-foreground"}`}>
          <input
            type="checkbox"
            checked={smsOptIn && !!phone.trim()}
            onChange={(e) => setSmsOptIn(e.target.checked)}
            disabled={!phone.trim()}
            className="mt-0.5 h-4 w-4 rounded border-border accent-amber-500 disabled:opacity-50"
          />
          <span>
            It's OK to text me follow-ups about my plan and Hartford updates. Msg/data rates may apply.
            {!phone.trim() && <span className="block text-[11px] italic">Add a cell phone above to enable.</span>}
          </span>
        </label>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-soft disabled:opacity-50"
        >
          {busy ? "Working…" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => { setView("signin"); setError(null); }}
        className="mt-4 w-full text-center text-[13px] text-muted-foreground hover:text-foreground"
      >
        Already have an account? Sign in
      </button>
    </AppShell>
  );
}
