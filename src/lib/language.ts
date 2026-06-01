import { useEffect, useState } from "react";

export type ContentLanguage = "en" | "es";

const STORAGE_KEY = "wuw_content_lang";
const EVENT = "wuw:content-lang-change";

export function getLanguage(): ContentLanguage {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "es" ? "es" : "en";
}

export function setLanguage(lang: ContentLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: lang }));
}

export function useLanguage(): [ContentLanguage, (lang: ContentLanguage) => void] {
  const [lang, setLangState] = useState<ContentLanguage>("en");

  useEffect(() => {
    setLangState(getLanguage());
    const handler = () => setLangState(getLanguage());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return [lang, setLanguage];
}
