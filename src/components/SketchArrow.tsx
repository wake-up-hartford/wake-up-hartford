// Hand-drawn, brush-stroke arrow inspired by a marker scribble.
// Filled shape (not stroked) so it reads as inky and organic at any size.
export function SketchArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Shaft + arrowhead drawn as one rough, slightly tilted shape */}
      <path
        d="
          M6,46
          C22,40 44,38 70,38
          L70,22
          C70,18 74,16 78,20
          L114,46
          C117,49 117,53 114,55
          L80,76
          C75,79 70,76 70,72
          L70,58
          C46,58 24,60 8,64
          C2,65 1,49 6,46 Z
        "
      />
      {/* tiny ink fleck for that marker feel */}
      <circle cx="3" cy="55" r="1.6" />
    </svg>
  );
}
