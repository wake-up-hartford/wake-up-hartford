import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Save, User as UserIcon, Mail, Phone, Globe, FileText, MessageSquare, ChevronRight, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ScriptWord } from "@/components/ScriptWord";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Account — Wake Up Wednesday" },
      { name: "description", content: "Manage your Wake Up Wednesday profile and saved plans." },
      { property: "og:title", content: "Your Account — Wake Up Wednesday" },
      { property: "og:description", content: "Manage your Wake Up Wednesday profile and saved plans." },
      { property: "og:url", content: "https://wake-up-hartford-guide.lovable.app/profile" },
      { property: "og:image", content: "https://wake-up-hartford-guide.lovable.app/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://wake-up-hartford-guide.lovable.app/profile" },
    ],
  }),
  component: ProfilePage,
});

function formatUSPhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}


function ProfilePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user, loading, isAnonymous } = useAuth();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const checkAdmin = useServerFn(checkIsAdmin);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile({}),
    enabled: !!user,
  });

  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkAdmin({}),
    enabled: !!user,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [languagePref, setLanguagePref] = useState("en");
  const [phone, setPhone] = useState("");
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  

  useEffect(() => {
    if (data?.profile) {
      setFirstName(data.profile.first_name ?? "");
      setLastName(data.profile.last_name ?? "");
      setLanguagePref(data.profile.language_pref ?? "en");
      setSmsAlerts(data.profile.sms_alerts ?? false);
      if (data.profile.phone) setPhone(formatUSPhone(data.profile.phone));
    }
  }, [data]);

  const phoneDigits = phone.replace(/\D/g, "").replace(/^1/, "");
  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 10;

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnonymous) {
      toast.error("Please sign in to update your profile.");
      return;
    }
    if (!firstName.trim()) {
      toast.error("First name can't be empty.");
      return;
    }
    if (!phoneValid) {
      toast.error("Please enter a 10-digit US phone number.");
      return;
    }
    const e164Phone = phoneDigits.length === 10 ? `+1${phoneDigits}` : null;
    setSavingPhone(true);
    try {
      await saveProfile({ data: { first_name: firstName.trim() || null, last_name: lastName.trim() || null, language_pref: languagePref, sms_alerts: smsAlerts, phone: e164Phone } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile and contact info saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update profile.");
    } finally {
      setSavingPhone(false);
    }
  };



  return (
    <AppShell>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Dashboard
      </Link>
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight sm:text-4xl">
        Your
        <span className="ml-2 font-script normal-case text-pink">
          <ScriptWord>Profile</ScriptWord>
        </span>
      </h1>
      <p className="mt-3 text-[13px] leading-snug text-foreground/80">View and update your info.</p>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard
          icon={FileText}
          value={data?.stats.plans ?? 0}
          label="Life Plans created"
          pop="pop-cyan"
        />
        <StatCard
          icon={CheckCircle}
          value={data?.stats.completedSteps ?? 0}
          label="Steps completed"
          pop="pop-pink"
        />
      </section>

      {data?.stats.mostRecentPlanId && (
        <Link
          to="/plan/$planId"
          params={{ planId: data.stats.mostRecentPlanId }}
          className="pop-card pop-purple mt-3 flex items-center justify-between rounded-2xl bg-card p-3.5 text-card-foreground"
        >
          <span className="text-[14px] font-semibold text-card-foreground">Back to your most recent plan</span>
          <ArrowRight className="h-4 w-4 text-primary" />
        </Link>
      )}

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <>
          {/* Combined Profile + Contact form */}
          <form
            onSubmit={handleSavePhone}
            className="pop-card pop-orange mt-6 space-y-3 rounded-2xl bg-card p-4 text-card-foreground sm:p-5"
          >
            <h2 className="font-display text-lg text-card-foreground">Profile & contact</h2>

            {isAnonymous && (
              <div className="rounded-xl border-[1.5px] border-pop-border bg-step-surface p-3 text-[13px] text-step-surface-foreground">
                <p className="mb-2">Sign in or create an account to update your profile and contact info.</p>
                <Link
                  to="/auth"
                  className="pop-btn inline-flex items-center gap-1 rounded-full bg-pink px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-primary-foreground"
                >
                  Sign in
                </Link>
              </div>
            )}

            <fieldset disabled={isAnonymous} className="space-y-3 disabled:opacity-60">
            <div className="grid grid-cols-2 gap-3">
              <Field icon={UserIcon} label="First name" htmlFor="first_name">
                <input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-full border-[1.5px] border-pop-border bg-step-resource px-4 py-2.5 text-[14px] text-step-resource-foreground placeholder:text-step-resource-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="First"
                />
              </Field>
              <Field icon={UserIcon} label="Last name (optional)" htmlFor="last_name">
                <input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-full border-[1.5px] border-pop-border bg-step-resource px-4 py-2.5 text-[14px] text-step-resource-foreground placeholder:text-step-resource-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Last"
                />
              </Field>
            </div>



            <Field icon={Mail} label="Email address" htmlFor="email">
              <input
                id="email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-full border-[1.5px] border-pop-border bg-step-surface px-4 py-2.5 text-[14px] text-step-surface-muted"
              />
            </Field>

            <Field icon={Phone} label="Phone number" htmlFor="phone">
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(formatUSPhone(e.target.value))}
                maxLength={14}
                placeholder="(555) 123-4567"
                aria-invalid={!phoneValid}
                aria-describedby={!phoneValid ? "phone-error" : "phone-dev-note"}
                className={`w-full rounded-full border-[1.5px] bg-step-resource px-4 py-2.5 text-[14px] text-step-resource-foreground placeholder:text-step-resource-muted focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  phoneValid ? "border-pop-border focus:border-primary" : "border-destructive focus:border-destructive"
                }`}
              />
            </Field>
            <p id="phone-dev-note" className="text-[12px] italic text-muted-foreground">
              development note: SMS provider needs to be connected
            </p>
            {!phoneValid && (
              <p id="phone-error" className="text-[12px] text-destructive">
                Please enter a 10-digit US phone number.
              </p>
            )}
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-card-foreground/30 text-accent focus:ring-accent"
              />
              <span className="text-[13px] text-card-foreground">Send me reminders and updates by text</span>
            </label>

            <Field icon={Globe} label="Preferred language (Spanish coming soon)" htmlFor="language_pref">
              <select
                id="language_pref"
                value={languagePref}
                onChange={(e) => setLanguagePref(e.target.value)}
                className="w-full rounded-full border-[1.5px] border-pop-border bg-step-resource px-4 py-2.5 text-[14px] text-step-resource-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </Field>

            <button
              type="submit"
              disabled={savingPhone || !phoneValid || isAnonymous}
              className="pop-btn inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2.5 font-display text-[14px] font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {savingPhone ? "Saving…" : "Save"}
            </button>
            </fieldset>
          </form>


          {/* Survey link */}
          <Link
            to="/survey"
            className="pop-card pop-pink mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 text-card-foreground transition-transform active:scale-[0.99]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink/20 text-pink">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] text-card-foreground">Got 30 seconds?</p>
              <p className="text-[12px] text-card-foreground/70">Tap to tell us what you think.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-card-foreground/60" />
          </Link>

          {/* Admin link */}
          {admin.data?.isAdmin && (
            <Link
              to="/admin"
              className="pop-card pop-purple mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 text-card-foreground transition-transform active:scale-[0.99]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] text-card-foreground">Admin</p>
                <p className="text-[12px] text-card-foreground/70">View survey results and analytics.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-card-foreground/60" />
            </Link>
          )}
        </>
      )}
      <Link
        to="/about"
        className="mt-6 block text-center text-[13px] text-muted-foreground underline hover:text-foreground"
      >
        About This Tool
      </Link>
    </AppShell>
  );
}

function Field({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sm:flex sm:items-center sm:gap-3">
      <label htmlFor={htmlFor} className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-card-foreground/70 sm:mb-0 sm:w-40 sm:shrink-0">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      <div className="sm:flex-1">{children}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  pop,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  pop: string;
}) {
  return (
    <div className={`pop-card ${pop} flex flex-col items-center gap-1 rounded-2xl bg-card p-3 text-card-foreground`}>
      <span className="text-[11px] uppercase tracking-wide text-card-foreground/70">{label}</span>
      <p className="font-display text-2xl text-primary tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
