// Lazy-loaded confetti — module is fetched only on first task-complete click.
let confettiPromise: Promise<(opts: Record<string, unknown>) => void> | null = null;

export function fireConfetti(anchor: HTMLElement) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const rect = anchor.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  if (!confettiPromise) {
    confettiPromise = import("canvas-confetti").then(
      (m) => (m as unknown as { default: (opts: Record<string, unknown>) => void }).default,
    );
  }
  confettiPromise.then((confetti) => {
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 35,
      ticks: 120,
      origin: { x, y },
      colors: ["#7b3fbf", "#3aa3d8", "#f4a73a", "#3fa86b", "#f5f0e0"],
      disableForReducedMotion: true,
    });
  });
}
