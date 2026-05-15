import { useEffect, useState } from "react";

const KEY = "wuw.address";

export function useStoredAddress() {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    try { setAddress(localStorage.getItem(KEY)); } catch {}
  }, []);
  const save = (v: string) => {
    setAddress(v);
    try { localStorage.setItem(KEY, v); } catch {}
  };
  const clear = () => {
    setAddress(null);
    try { localStorage.removeItem(KEY); } catch {}
  };
  return { address, save, clear };
}
