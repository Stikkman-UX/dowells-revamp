export type PlayPauseTone = "onDark" | "onLight";

type PlayPauseButtonProps = {
  paused: boolean;
  onToggle: () => void;
  /** What the control pauses, used for the accessible name. */
  label?: string;
  tone?: PlayPauseTone;
  className?: string;
};

const TONE_CLASSES: Record<PlayPauseTone, string> = {
  onDark:
    "bg-black/30 text-white hover:bg-black/50 focus-visible:outline-white",
  onLight:
    "bg-white text-ink shadow-sm hover:bg-grey-50 focus-visible:outline-brand",
};

/**
 * THE pause/play control for auto-advancing sections. Every autoplaying
 * carousel needs one (WCAG 2.2.2 Pause, Stop, Hide) — `tone` is the only
 * thing that differs between the dark hero and the light industries slider.
 */
export function PlayPauseButton({
  paused,
  onToggle,
  label = "slideshow",
  tone = "onDark",
  className = "",
}: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={paused}
      // Read by useAutoplayGate: focus on this control must not itself pause.
      data-autoplay-control=""
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      <span className="sr-only">
        {paused ? `Play ${label}` : `Pause ${label}`}
      </span>
      {paused ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 1.5L10 6L2.5 10.5V1.5Z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <rect x="2" y="1.5" width="2.75" height="9" fill="currentColor" />
          <rect x="7.25" y="1.5" width="2.75" height="9" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
