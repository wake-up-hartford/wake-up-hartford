import { AlertTriangle, Phone } from "lucide-react";

type Props = {
  flags: { note: string; hotline: string }[];
};

export function CrisisFlags({ flags }: Props) {
  if (!flags?.length) return null;
  return (
    <div className="mb-5 rounded-2xl border-2 border-red-500/50 bg-red-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-red-700">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-[12px] font-semibold uppercase tracking-wider">Right now</span>
      </div>
      <ul className="space-y-2">
        {flags.map((c, i) => (
          <li key={i} className="text-[14px] text-red-900">
            <p>{c.note}</p>
            <a href={`tel:${c.hotline.replace(/[^\d]/g, "")}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-red-700 underline">
              <Phone className="h-3.5 w-3.5" /> {c.hotline}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
