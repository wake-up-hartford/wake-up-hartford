import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppShell } from "@/components/AppShell";
import { claimGuestPlans } from "@/lib/stabilization-plan.functions";
import wakeUpMovement from "@/assets/wake-up-movement.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Wake Up Wednesday" },
      { name: "description", content: "Sign in or create an account on Wake Up Wednesday." },
      { property: "og:title", content: "Sign in — Wake Up Wednesday" },
      { property: "og:description", content: "Sign in or create an account on Wake Up Wednesday." },
      { property: "og:url", content: siteUrl("/auth") },
      { property: "og:image", content: siteUrl("/og-image.jpg") },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "canonical", href: siteUrl("/auth") },
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

const inputCls =
  "w-full rounded-full border-[1.5px] border-pop-border bg-step-resource px-4 py-2.5 text-[14px] text-step-resource-foreground placeholder:text-step-resource-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const primaryBtn =
  "pop-btn flex w-full items-center justify-center gap-2 rounded-full bg-pink px-5 py-3 font-display text-[15px] font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60";

const secondaryBtn =
  "pop-btn flex w-full items-center justify-center gap-2 rounded-full bg-card px-5 py-3 text-[14px] font-semibold text-card-foreground";

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
  const [optOut, setOptOut] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const claimGuest = useServerFn(claimGuestPlans);

  // If the visitor made a plan as a guest, move it onto the account they
  // just signed into. The guest user id is stashed in localStorage before
  // sign-in (it survives the Google OAuth round-trip).
  const claimGuestPlansFor = async () => {
    if (typeof window === "undefined") return;
    const guestId = window.localStorage.getItem("wuw:guestUserId");
    if (!guestId) return;
    window.localStorage.removeItem("wuw:guestUserId");
    try {
      await claimGuest({ data: { guestUserId: guestId } });
    } catch {
      // Non-fatal: worst case the guest plan stays on the guest session.
    }
  };

  const stashGuestUserId = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const anon = sessionData.session?.user;
    if (anon?.is_anonymous && typeof window !== "undefined") {
      window.localStorage.setItem("wuw:guestUserId", anon.id);
    }
  };

  const ALLOWED_POST_AUTH_PATHS = ["/life", "/plans", "/dashboard", "/onboarding/address"];

  const isValidPostAuthRedirect = (target: string | null): target is string => {
    if (!target) return false;
    return ALLOWED_POST_AUTH_PATHS.includes(target) || /^\/plan\/[a-f0-9-]+$/i.test(target);
  };

  const resolveDestinationForUser = async (userId: string, requested: string): Promise<string> => {
    // If we already know where to send them and it's not the dashboard fallback, honor it.
    if (requested !== "/dashboard") return requested;
    const { data } = await supabase
      .from("profiles")
      .select("street_address")
      .eq("id", userId)
      .maybeSingle();
    if (!data?.street_address) return "/onboarding/address";
    return requested;
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && !session.user.is_anonymous) {
        await claimGuestPlansFor();
        const target = await resolveDestinationForUser(session.user.id, consumePostAuthRedirect());
        nav({ to: target, replace: true });
      }
    });
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!error && data.user && !data.user.is_anonymous) {
        await claimGuestPlansFor();
        const target = await resolveDestinationForUser(data.user.id, consumePostAuthRedirect());
        nav({ to: target, replace: true });
      }
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
    await stashGuestUserId();
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
        await stashGuestUserId();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await claimGuestPlansFor();
        const uid = data.user?.id;
        const target = uid
          ? await resolveDestinationForUser(uid, consumePostAuthRedirect())
          : consumePostAuthRedirect();
        nav({ to: target, replace: true });
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
        <div className="pop-card pop-cyan mt-8 flex flex-col items-center rounded-2xl bg-card p-5 text-center text-card-foreground">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight">Check your email</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-card-foreground/80">
            We sent a confirmation link to
          </p>
          <p className="mt-1 text-[15px] font-semibold">{pendingEmail}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-card-foreground/70">
            Click the link in that email to activate your account, then come back here to sign in.
          </p>

          <button
            onClick={handleResend}
            disabled={busy || resendCooldown > 0}
            className={`${secondaryBtn} mt-6`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend confirmation email"}
          </button>

          <button
            onClick={() => { setView("signup"); setError(null); }}
            className="mt-3 text-[13px] text-card-foreground/70 hover:text-card-foreground"
          >
            Use a different email
          </button>
          <button
            onClick={() => { setView("signin"); setError(null); }}
            className="mt-2 text-[13px] text-card-foreground/70 hover:text-card-foreground"
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
        <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground">Reset your password</h1>
        <p className="mt-3 text-[13px] leading-snug text-foreground/80">
          Enter the email for your account and we'll send you a link to set a new password.
        </p>
        <form onSubmit={handleForgot} className="pop-card pop-purple mt-5 space-y-3 rounded-2xl bg-card p-4 text-card-foreground">
          <label htmlFor="forgot-email" className="sr-only">Email</label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputCls}
          />
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className={primaryBtn}
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
          <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground">Sign In...</h1>
          <p className="text-[13px] leading-snug text-foreground/80">
            ...to get free resources, save your Life Plan and be part of a movement that's changing Hartford.
          </p>
          <div className="pop-card pop-pink space-y-2 rounded-2xl bg-card p-4 text-card-foreground">
            <label className="flex items-start gap-2 text-[13px] leading-snug">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => {
                  setOptIn(e.target.checked);
                  if (e.target.checked) setOptOut(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border-pop-border accent-pink"
              />
              <span>Yes, NAACP can send me resources and updates.</span>
            </label>
            <label className="flex items-start gap-2 text-[13px] leading-snug">
              <input
                type="checkbox"
                checked={optOut}
                onChange={(e) => {
                  setOptOut(e.target.checked);
                  if (e.target.checked) setOptIn(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border-pop-border accent-pink"
              />
              <span>No, I do not want to receive resources and updates.</span>
            </label>
            <p className="text-[12px] leading-snug text-card-foreground/70">
              Change choice anytime from your "You" settings.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => { setView("signup"); setError(null); }}
            className={primaryBtn}
          >
            Sign up with Google or email
          </button>
          <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <button
            onClick={() => { setView("signin"); setError(null); }}
            className={secondaryBtn}
          >
            Already Registered? Sign In
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <p className="text-[13px] font-semibold text-foreground">Be a part of the</p>
          <img
            src={wakeUpMovement}
            alt="Wake Up Movement"
            className="mt-2 w-48 max-w-full"
          />
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
        <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground">Sign in</h1>
        <p className="mt-3 text-[13px] leading-snug text-foreground/80">
          Welcome back. Use Google or the email and password you signed up with.
        </p>

        <button
          onClick={handleGoogle}
          className={`${secondaryBtn} mt-5`}
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="pop-card pop-orange space-y-3 rounded-2xl bg-card p-4 text-card-foreground">
          <label htmlFor="signin-email" className="sr-only">Email</label>
          <input
            id="signin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputCls}
          />
          <label htmlFor="signin-password" className="sr-only">Password</label>
          <input
            id="signin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={inputCls}
          />
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className={primaryBtn}
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
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-foreground">Create your account</h1>
      <p className="mt-3 text-[13px] leading-snug text-foreground/80">
        Sign up with Google for one-tap access, or create an account with your email and a password.
      </p>

      <button
        onClick={handleGoogle}
        className={`${secondaryBtn} mt-5`}
      >
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or sign up with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmail} className="pop-card pop-orange space-y-3 rounded-2xl bg-card p-4 text-card-foreground">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-first" className="sr-only">First name</label>
            <input
              id="signup-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name (optional)"
              autoComplete="given-name"
              className={inputCls}
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
              className={inputCls}
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
          className={inputCls}
        />
        <label htmlFor="signup-email" className="sr-only">Email</label>
        <input
          id="signup-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputCls}
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
          className={inputCls}
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
          className={inputCls}
        />
        {showPwHelp && (
          <div className="rounded-xl border-[1.5px] border-pop-border bg-step-surface p-3 text-[12px] text-step-surface-muted">
            <p className="mb-1 font-semibold text-step-surface-foreground">Password must:</p>
            <ul className="list-disc space-y-0.5 pl-4">
              <li>Be at least 8 characters long</li>
              <li>Include upper &amp; lowercase letters, a number, and a symbol</li>
              <li>Not be a common or previously leaked password (e.g. "password123")</li>
            </ul>
          </div>
        )}
        <label className="flex items-start gap-2 text-[13px] leading-snug text-card-foreground">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => {
              setOptIn(e.target.checked);
              if (e.target.checked) setOptOut(false);
            }}
            className="mt-0.5 h-4 w-4 rounded border-border accent-pink"
          />
          <span>Yes, NAACP can send me resources and updates.</span>
        </label>
        <label className="flex items-start gap-2 text-[13px] leading-snug text-card-foreground">
          <input
            type="checkbox"
            checked={optOut}
            onChange={(e) => {
              setOptOut(e.target.checked);
              if (e.target.checked) setOptIn(false);
            }}
            className="mt-0.5 h-4 w-4 rounded border-border accent-pink"
          />
          <span>No, I do not want to receive resources and updates.</span>
        </label>
        <p className="text-[12px] leading-snug text-card-foreground/70">
          You can change it anytime from your account settings.
        </p>
        <label className={`flex items-start gap-2 text-[13px] leading-snug ${phone.trim() ? "text-card-foreground" : "text-card-foreground/60"}`}>
          <input
            type="checkbox"
            checked={smsOptIn && !!phone.trim()}
            onChange={(e) => setSmsOptIn(e.target.checked)}
            disabled={!phone.trim()}
            className="mt-0.5 h-4 w-4 rounded border-border accent-pink disabled:opacity-50"
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
          className={primaryBtn}
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

      <div className="mt-6 flex flex-col items-center text-center">
        <p className="text-[13px] font-semibold text-foreground">Join the</p>
        <img
          src={wakeUpMovement}
          alt="Wake Up Movement"
          className="mt-2 w-48 max-w-full"
        />
      </div>
    </AppShell>
  );
}
