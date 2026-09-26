"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IndustriesData } from "@/types/cms";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsIcon } from "@/components/ui/CmsIcon";
import { PlayPauseButton } from "@/components/ui/PlayPauseButton";
import { useAutoplayGate } from "@/hooks/useAutoplayGate";

type IndustriesSliderProps = { slides: IndustriesData["slides"] };

const ARROW_ICON = {
  assetId: "",
  alt: "",
  url: "/home/industries/icon-arrow-right.svg",
  mimeType: "image/svg+xml",
  fileType: "Image" as const,
  fileSize: 0,
};

/** How long each slide rests before autoplay advances. */
const AUTOPLAY_MS = 5000;
/** How still the track must be before a loop recentre is safe. */
const SCROLL_IDLE_MS = 150;
/** Copies of the slide list rendered; the viewer always lives in the middle one. */
const LOOP_COPIES = 3;

/**
 * Horizontal peeking slider (Figma node 313:484). Native CSS scroll-snap
 * drives layout and gives touch swipe "for free"; this island tracks which
 * slide is centred (IntersectionObserver) so it can dim inactive cards,
 * animate the pill pagination, and expose prev/next, keyboard arrows and
 * pill clicks.
 *
 * Looping is seamless rather than a rewind: the slide list is rendered
 * LOOP_COPIES times and the viewer is silently returned to the middle copy
 * whenever the track falls idle outside it. Because every copy is identical,
 * re-centring the twin of the current slide lands on a pixel-identical
 * scroll position, so the jump is invisible — the only tell would be the
 * scale/opacity transition firing on the swapped element, which `recentring`
 * suppresses for that frame.
 */
export default function IndustriesSlider({ slides }: IndustriesSliderProps) {
  const count = slides.length;
  // A single slide has nowhere to loop or advance to.
  const loop = count > 1;

  const items = loop
    ? Array.from({ length: LOOP_COPIES * count }, (_, i) => slides[i % count])
    : slides;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // Index into `items`; in loop mode it is kept inside the middle copy.
  const [active, setActive] = useState(loop ? count : 0);
  const [recentring, setRecentring] = useState(false);
  // Bumped by manual navigation so the dwell timer restarts from that moment.
  const [dwell, setDwell] = useState(0);

  // Mirrors `active` for the timer and scroll-idle callbacks, which must read
  // the current index without being re-created on every advance.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const setItemRef = useCallback(
    (i: number) => (el: HTMLAnchorElement | null) => {
      itemRefs.current[i] = el;
    },
    []
  );

  const { allowedRef, reducedMotionRef, userPaused, toggleUserPause } = useAutoplayGate(
    rootRef,
    { enabled: loop, pauseOnHover: true }
  );

  /**
   * Centres `index` in the track. Scrolls the track directly instead of
   * using `scrollIntoView`, which would also drag the page vertically to
   * this section.
   */
  const scrollToIndex = useCallback(
    (index: number, smooth: boolean) => {
      const track = trackRef.current;
      const el = itemRefs.current[index];
      if (!track || !el) return;

      const trackRect = track.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const delta = elRect.left + elRect.width / 2 - (trackRect.left + trackRect.width / 2);

      track.scrollTo({
        left: track.scrollLeft + delta,
        // "instant", never "auto": an "auto" scroll defers to the track's CSS
        // scroll-behavior, which would turn a silent recentre into a visible
        // slide across the whole copy.
        behavior: smooth && !reducedMotionRef.current ? "smooth" : "instant",
      });
    },
    [reducedMotionRef]
  );

  const goTo = useCallback(
    (index: number, manual = false) => {
      if (manual) setDwell((n) => n + 1);
      scrollToIndex(Math.max(0, Math.min(items.length - 1, index)), true);
    },
    [items.length, scrollToIndex]
  );

  // Open on the middle copy so there is already a full set of slides to
  // scroll back through.
  useEffect(() => {
    if (!loop) return;
    scrollToIndex(count, false);
  }, [loop, count, scrollToIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length <= 1) return;

    const ratios = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          ratios.set(index, entry.intersectionRatio);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        for (const [index, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        }
        if (bestRatio > 0) setActive(bestIndex);
      },
      { root: track, threshold: [0, 0.25, 0.5, 0.75, 0.9, 1] }
    );
    itemRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  const recentre = useCallback(() => {
    if (!loop) return;
    const current = activeRef.current;
    if (current >= count && current < count * 2) return;

    const target = count + (((current % count) + count) % count);
    setRecentring(true);
    setActive(target);
    scrollToIndex(target, false);
    // One frame to paint the swapped slide with transitions off, one more
    // before turning them back on.
    requestAnimationFrame(() => requestAnimationFrame(() => setRecentring(false)));
  }, [loop, count, scrollToIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;

    let idle: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(idle);
      idle = setTimeout(recentre, SCROLL_IDLE_MS);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(idle);
      track.removeEventListener("scroll", onScroll);
    };
  }, [loop, recentre]);

  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => {
      // A tick that lands while the gate is shut is simply skipped — the
      // next one resumes as soon as the section is back in view.
      if (!allowedRef.current) return;
      scrollToIndex(Math.min(items.length - 1, activeRef.current + 1), true);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [loop, dwell, items.length, scrollToIndex, allowedRef]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(activeRef.current + 1, true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(activeRef.current - 1, true);
      }
    },
    [goTo]
  );

  if (count === 0) return null;

  // Clones exist only to make the loop seamless; the accessibility tree and
  // the tab order see each industry exactly once.
  const isClone = (i: number) => loop && (i < count || i >= count * 2);
  const activeReal = ((active % count) + count) % count;

  return (
    <div ref={rootRef} className="flex flex-col gap-6 lg:gap-8">
      <div className="relative">
        <div
          ref={trackRef}
          onKeyDown={handleKeyDown}
          tabIndex={count > 1 ? 0 : undefined}
          role={count > 1 ? "region" : undefined}
          aria-roledescription={count > 1 ? "carousel" : undefined}
          aria-label={count > 1 ? "Industries we serve" : undefined}
          // Figma: the active slide is 1234px wide and centred; neighbours sit
          // 41px away and only peek inside the page gutters. Track padding
          // centres the first/last slide the same way. Smoothness is decided
          // per scroll in JS, so there is deliberately no `scroll-smooth`
          // class to override an instant recentre.
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc((100%-var(--slide-w))/2)] py-2 [--slide-w:85vw] [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:[--slide-w:70vw] lg:gap-[2.5625rem] lg:[--slide-w:min(77.125rem,calc(100vw-10rem))] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((slide, i) => {
            const isActive = i === active;
            const clone = isClone(i);
            return (
              <a
                key={`${i}-${slide.href}`}
                ref={setItemRef(i)}
                data-index={i}
                href={slide.href}
                aria-hidden={clone || undefined}
                tabIndex={clone ? -1 : undefined}
                aria-current={isActive || undefined}
                aria-label={
                  count > 1 ? `${slide.title} (${(i % count) + 1} of ${count})` : slide.title
                }
                // `isolate` gives every slide its own stacking context so the
                // media can never fall behind the section background. Inactive
                // slides shrink to Figma's 1068x411 (x0.865) away from the
                // active one, keeping the 41px gap between facing edges.
                className={`group relative isolate flex h-[22rem] w-[var(--slide-w)] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-[1.125rem] lg:aspect-[1234/475] lg:h-auto ${
                  recentring
                    ? "transition-none"
                    : "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none"
                } ${
                  isActive
                    ? "opacity-100"
                    : `opacity-60 lg:scale-[0.865] ${i < active ? "lg:origin-right" : "lg:origin-left"}`
                }`}
              >
                <CmsMedia
                  media={slide.image}
                  alt={slide.title}
                  sizes="(min-width: 1024px) 77.125rem, 85vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/45" />

                <div className="relative z-10 flex items-end justify-between gap-6 p-6 lg:p-9">
                  <div className="flex max-w-[35rem] flex-col gap-2">
                    <h3 className="text-2xl font-medium leading-tight text-white lg:text-[2rem]">
                      {slide.title}
                    </h3>
                    <p className="text-sm text-white/80 lg:max-w-[35rem] lg:text-base">
                      {slide.description}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-transform duration-300 group-hover:translate-x-1 lg:h-12 lg:w-12"
                  >
                    <CmsIcon media={ARROW_ICON} size={16} className="text-white" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1, true)}
              disabled={!loop && active === 0}
              aria-label="Previous industry"
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md transition-opacity hover:bg-grey-50 disabled:opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:flex"
            >
              <CmsIcon media={ARROW_ICON} size={14} className="rotate-180 text-ink" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1, true)}
              disabled={!loop && active === count - 1}
              aria-label="Next industry"
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md transition-opacity hover:bg-grey-50 disabled:opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:flex"
            >
              <CmsIcon media={ARROW_ICON} size={14} className="text-ink" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-3">
          <PlayPauseButton
            paused={userPaused}
            onToggle={toggleUserPause}
            label="industries slideshow"
            tone="onLight"
          />
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={`${slide.href}-${i}`}
                type="button"
                onClick={() => goTo(loop ? count + i : i, true)}
                aria-label={`Go to ${slide.title}`}
                aria-current={i === activeReal || undefined}
                className={`h-[0.5625rem] rounded-full transition-[width,background-color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  i === activeReal
                    ? "w-[6.75rem] bg-brand"
                    : "w-[1.625rem] bg-grey-300 hover:bg-grey-400"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
