import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/onboarding/address")({
  head: () => ({
    meta: [
      { title: "Add your address — Wake Up Wednesday" },
      { name: "description", content: "Tell us where you live so we can tailor your Life Plan to your Hartford neighborhood." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingAddressPage,
});

const addressSchema = z.object({
  street_address: z
    .string()
    .trim()
    .min(3, { message: "Enter your street address." })
    .max(200, { message: "That address is too long." }),
  zip_code: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, { message: "Enter a valid ZIP code (e.g. 06103)." }),
});

function OnboardingAddressPage() {
  const nav = useNavigate();
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Require sign-in; prefill from existing profile if present.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user || user.is_anonymous) {
        nav({ to: "/auth", replace: true });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("street_address, zip_code")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.street_address) setStreet(data.street_address);
      if (data?.zip_code) setZip(data.zip_code);
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = addressSchema.safeParse({ street_address: street, zip_code: zip });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the fields.");
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        nav({ to: "/auth", replace: true });
        return;
      }
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          street_address: parsed.data.street_address,
          zip_code: parsed.data.zip_code,
        })
        .eq("id", user.id);
      if (upErr) throw upErr;
      nav({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save your address. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <AppShell>
        <p className="mt-8 text-center text-[14px] text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mt-6 space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1 of 1</p>
        <h1 className="font-display text-3xl leading-tight text-foreground">Where do you live?</h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          We use your address to connect you with the right Hartford resources and neighborhood updates. Your address is private.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div>
          <label htmlFor="street" className="mb-1 block text-[13px] font-semibold text-foreground">
            Street address
          </label>
          <input
            id="street"
            type="text"
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="123 Main St, Apt 2"
            autoComplete="street-address"
            maxLength={200}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
          />
        </div>

        <div>
          <label htmlFor="zip" className="mb-1 block text-[13px] font-semibold text-foreground">
            ZIP code
          </label>
          <input
            id="zip"
            type="text"
            inputMode="numeric"
            required
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="06103"
            autoComplete="postal-code"
            maxLength={10}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground"
          />
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="pop-btn flex w-full items-center justify-center gap-2 rounded-full bg-pink px-5 py-3 font-display text-[15px] font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Continue"}
        </button>

        <button
          type="button"
          onClick={() => nav({ to: "/dashboard", replace: true })}
          className="w-full text-center text-[13px] text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </form>
    </AppShell>
  );
}
