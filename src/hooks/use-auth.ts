import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Auth hook. Optionally ensures a session exists by silently signing the
 * visitor in anonymously — used so the survey can generate a plan without a
 * sign-in wall. Users can later upgrade the anonymous account (linkIdentity
 * / updateUser with email) to save or share the plan.
 */
export function useAuth(opts?: { ensureAnonymous?: boolean }) {
  const ensureAnonymous = opts?.ensureAnonymous ?? false;
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const attemptedAnon = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      let current = data.session;
      if (!current && ensureAnonymous && !attemptedAnon.current) {
        attemptedAnon.current = true;
        try {
          const { data: anon, error } = await supabase.auth.signInAnonymously();
          if (!error) current = anon.session;
        } catch {
          // swallow — UI will fall back to "sign in" flow
        }
      }
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    })();

    return () => subscription.unsubscribe();
  }, [ensureAnonymous]);

  const isAnonymous = !!user?.is_anonymous;

  return {
    session,
    user,
    loading,
    isAnonymous,
    signOut: () => supabase.auth.signOut(),
  };
}
