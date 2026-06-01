import { useLanguage, type ContentLanguage } from "@/lib/language";

type Props = {
  className?: string;
};

export function LanguageToggle({ className = "" }: Props) {
  const [lang, setLang] = useLanguage();

  const Option = ({ value, label }: { value: ContentLanguage; label: string }) => {
    const active = lang === value;
    return (
      <button
        type="button"
        onClick={() => setLang(value)}
        aria-pressed={active}
        className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
          active
            ? "bg-gold text-gold-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label="Switch content language"
      className={`inline-flex overflow-hidden rounded-full border border-border bg-card/60 ${className}`}
    >
      <Option value="en" label="EN" />
      <Option value="es" label="ES" />
    </div>
  );
}
