import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Save, User as UserIcon, Mail, Phone, Globe, FileText, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your account" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile({}),
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState("");
  const [languagePref, setLanguagePref] = useState("en");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      setDisplayName(data.profile.display_name ?? "");
      setLanguagePref(data.profile.language_pref ?? "en");
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
      await saveProfile({ data: { display_name: displayName.trim(), language_pref: languagePref } });
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
      const { error } = await supabase.auth.updateUser({ phone: phone.trim() || undefined });
      if (error) throw error;
      toast.success(phone.trim() ? "Phone update sent — check for a verification code." : "Phone cleared.");
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
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent.");
  };

  return (
    <AppShell>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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

            <Field icon={Globe} label="Preferred language" htmlFor="language_pref">
              <select
                id="language_pref"
                value={languagePref}
                onChange={(e) => setLanguagePref(e.target.value)}
                className="w-full rounded-lg border border-card-foreground/20 bg-white px-3 py-2 text-[14px] text-card-foreground focus:border-accent focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
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

          {/* Email (read-only) */}
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
            <h2 className="font-display text-lg text-card-foreground">Email</h2>
            <Field icon={Mail} label="Email address" htmlFor="email">
              <input
                id="email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-lg border border-card-foreground/20 bg-white/60 px-3 py-2 text-[14px] text-card-foreground/70"
              />
            </Field>
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Send password reset email
            </button>
          </div>

          {/* Phone */}
          <form
            onSubmit={handleSavePhone}
            className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground"
          >
            <h2 className="font-display text-lg text-card-foreground">Phone</h2>
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
            <p className="text-[12px] text-card-foreground/70">
              Use international format (e.g. +1 for US). You'll receive a code to verify.
            </p>
            <button
              type="submit"
              disabled={savingPhone}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-semibold text-accent-foreground shadow-soft hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {savingPhone ? "Saving…" : "Save phone"}
            </button>
          </form>
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
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-card-foreground/70">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      {children}
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
