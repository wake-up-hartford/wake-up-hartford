import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Save, User as UserIcon, Mail, Phone, Globe, FileText, ClipboardList, MessageSquare, ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
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

function ProfilePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
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

  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [languagePref, setLanguagePref] = useState("en");
  const [phone, setPhone] = useState("");
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      setDisplayName(data.profile.display_name ?? "");
      setFirstName(data.profile.first_name ?? "");
      setLastName(data.profile.last_name ?? "");
      setLanguagePref(data.profile.language_pref ?? "en");
      setSmsAlerts(data.profile.sms_alerts ?? false);
    }
  }, [data]);


  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Name can't be empty.");
      return;
    }
    setSavingProfile(true);
    try {
      await saveProfile({ data: { display_name: displayName.trim(), first_name: firstName.trim() || null, last_name: lastName.trim() || null, language_pref: languagePref } });
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      const [{ error: phoneError }] = await Promise.all([
        supabase.auth.updateUser({ phone: phone.trim() || undefined }),
        saveProfile({ data: { display_name: displayName.trim(), first_name: firstName.trim() || null, last_name: lastName.trim() || null, language_pref: languagePref, sms_alerts: smsAlerts } }),
      ]);
      if (phoneError) throw phoneError;
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success(phone.trim() ? "Phone and alert preference saved." : "Phone cleared and preference saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update phone.");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent.");
      setResetSent(true);
    }
  };

  return (
    <AppShell>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>
      <h1 className="font-display text-3xl text-foreground">Your account</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">View and update your info.</p>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard
          icon={FileText}
          value={data?.stats.plans ?? 0}
          label="Life Plans created"
        />
        <StatCard
          icon={ClipboardList}
          value={data?.stats.assessments ?? 0}
          label="Self-assessments taken"
        />
      </section>

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <>
          {/* Profile form */}
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground"
          >
            <h2 className="font-display text-lg text-card-foreground">Profile</h2>

            <Field icon={UserIcon} label="Display name" htmlFor="display_name">
              <input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground placeholder:text-card-foreground/40 focus:border-accent focus:outline-none"
                placeholder="Your name"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field icon={UserIcon} label="First name (optional)" htmlFor="first_name">
                <input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground placeholder:text-card-foreground/40 focus:border-accent focus:outline-none"
                  placeholder="First"
                />
              </Field>
              <Field icon={UserIcon} label="Last name (optional)" htmlFor="last_name">
                <input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground placeholder:text-card-foreground/40 focus:border-accent focus:outline-none"
                  placeholder="Last"
                />
              </Field>
            </div>


            <Field icon={Globe} label="Preferred language" htmlFor="language_pref">
              <select
                id="language_pref"
                value={languagePref}
                onChange={(e) => setLanguagePref(e.target.value)}
                className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground focus:border-accent focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es" disabled>Español — coming soon</option>
              </select>
            </Field>


            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-semibold text-accent-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>

          {/* Contact (email + phone) */}
          <form
            onSubmit={handleSavePhone}
            className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground"
          >
            <h2 className="font-display text-lg text-card-foreground">Contact</h2>

            <Field icon={Mail} label="Email address" htmlFor="email">
              <input
                id="email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-lg border border-card-foreground/20 bg-white/60 px-3 py-2 text-[14px] text-card-foreground/70"
              />
            </Field>

            <Field icon={Phone} label="Phone number" htmlFor="phone">
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                placeholder="+15551234567"
                className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground placeholder:text-card-foreground/40 focus:border-accent focus:outline-none"
              />
            </Field>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-card-foreground/30 text-accent focus:ring-accent"
              />
              <span className="text-[13px] text-card-foreground">Send me reminders and updates by text</span>
            </label>
            <p className="text-[12px] text-card-foreground/70">
              Use international format (e.g. +1 for US). You'll receive a code to verify.
            </p>
            <button
              type="submit"
              disabled={savingPhone}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-semibold text-accent-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {savingPhone ? "Saving…" : "Save contact"}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="block text-[13px] font-medium text-primary hover:underline"
            >
              Send password reset email
            </button>
            {resetSent && (
              <p className="text-[13px] text-success font-medium">
                Check your inbox — a reset link has been sent.
              </p>
            )}
          </form>

          {/* Survey link */}
          <Link
            to="/survey"
            className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 p-4 text-white shadow-soft transition-transform active:scale-[0.99]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] text-white">Quick 5-question survey</p>
              <p className="text-[12px] text-white/85">Help us make this app better. Takes about 30 seconds.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/80" />
          </Link>

          {/* Admin link */}
          {admin.data?.isAdmin && (
            <Link
              to="/admin"
              className="mt-4 flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-foreground shadow-soft transition-transform active:scale-[0.99]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] text-foreground">Admin</p>
                <p className="text-[12px] text-muted-foreground">View survey results and analytics.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </>
      )}
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <div className="flex items-center gap-1.5 text-card-foreground/70">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-display text-2xl text-primary tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
