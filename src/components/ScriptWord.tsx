import { ReactNode } from "react";

/**
 * Pink script word with the hand-drawn swoosh underneath, as used on the
 * dashboard greeting and the Life / Home page headings.
 */
export function ScriptWord({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      <svg
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-2.5 w-full text-pink"
      >
        <path
          d="M2 9 C 60 2, 140 2, 198 7"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
