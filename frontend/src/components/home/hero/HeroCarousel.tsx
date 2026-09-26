"use client";

import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import type { HeroData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsButton, ctaVariant } from "@/components/ui/CmsButton";
import { CmsIcon } from "@/components/ui/CmsIcon";
import { HighlightedText } from "@/components/ui/HighlightedText";
import { PlayPauseButton } from "@/components/ui/PlayPauseButton";
import { useAutoplayGate } from "@/hooks/useAutoplayGate";

gsap.registerPlugin(useGSAP, CustomEase);
// Figma prototype easing: "ease-in-and-out" = cubic-bezier(0.42, 0, 0.58, 1)
CustomEase.create("figmaInOut", "0.42, 0, 0.58, 1");

const ARROW_ICON = {
  assetId: "",
  alt: "",
  url: "/home/hero/icon-arrow-right.svg",
  mimeType: "image/svg+xml",
  fileType: "Image" as const,
  fileSize: 0,
};

const HOLD_SECONDS = 3;
const WIPE_SECONDS = 1.5;
const REDUCED_SECONDS = 0.3;
/** Cap on how long an advance waits for the incoming image to load. */
const LOAD_TIMEOUT_MS = 1000;

type HeroCarouselProps = { data: HeroData };

/**
 * Figma hero carousel (node 313:320 / component 151:640). Only the
 * background media rotates — the heading, CTA buttons and stats are static
 * and sit on top of every item. Reproduces the prototype's wipe-in-from-the-
 * right Smart Animate transition: the incoming item's oversized media box
 * starts scaled down and shifted right, clipped to a 0-width reveal at the
 * right edge, then both clip and media scale animate to their Figma
 * end-state over 1.5s (ease cubic-bezier(0.42,0,0.58,1)), after a 3s hold.
 * Every advance (including the wrap from the last item back to the first)
 * uses this same wipe.
 *
 * Server-rendered markup already encodes the correct hidden/visible state
 * for every item (clip-path + visibility keyed off `index === 0`, never off
 * client state), so there is no flash before hydration and GSAP never needs
 * to set an initial state on mount — it only takes over from whatever the
 * SSR HTML already shows.
 */
export default function HeroCarousel({ data }: HeroCarouselProps) {
  const { heading, buttons, stats, carousel } = data;
  const count = carousel.length;

  const sectionRef = useRef<HTMLElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const mediaRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const currentIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const holdTweenRef = useRef<gsap.core.Tween | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  // Declared before useGSAP so the gate is seeded before the first armHold().
  const { allowedRef, reducedMotionRef, userPaused, toggleUserPause } = useAutoplayGate(
    sectionRef,
    { enabled: count > 1, onChange: () => gateHold() }
  );

  const setLayerRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      layerRefs.current[i] = el;
    },
    []
  );
  const setMediaRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      mediaRefs.current[i] = el;
    },
    []
  );
  const setVideoRef = useCallback(
    (i: number) => (el: HTMLVideoElement | null) => {
      videoRefs.current[i] = el;
    },
    []
  );

  function gateHold() {
    holdTweenRef.current?.paused(!allowedRef.current);
  }

  function armHold() {
    holdTweenRef.current?.kill();
    holdTweenRef.current = null;
    if (count <= 1 || reducedMotionRef.current) return;
    // Give the item this hold will advance to a head start on loading.
    warmUp((currentIndexRef.current + 1) % count);
    holdTweenRef.current = gsap.delayedCall(HOLD_SECONDS, () => {
      void goTo((currentIndexRef.current + 1) % count);
    });
    gateHold();
  }

  function getMediaEl(wrapper: HTMLDivElement | null): HTMLImageElement | HTMLVideoElement | null {
    if (!wrapper) return null;
    return wrapper.querySelector("img, video");
  }

  /**
   * Kicks off the fetch for an upcoming item. Items past the second are
   * rendered `loading="lazy"` so they never compete with the LCP image, and
   * the browser will not fetch them on its own: every inactive layer sits
   * inside a `visibility: hidden` parent, which defers lazy loading forever
   * even though the layer is in the viewport. Flipping the attribute to
   * "eager" is what actually starts the request.
   */
  function warmUp(index: number) {
    const el = getMediaEl(mediaRefs.current[index]);
    if (el instanceof HTMLImageElement && el.loading === "lazy") {
      el.loading = "eager";
    }
  }

  /**
   * Best-effort wait so the wipe never reveals a blank layer. Returns at
   * once for an image that has already loaded — which, thanks to warmUp()
   * running a full hold earlier, is the normal autoplay case.
   *
   * Waits on `load` rather than `decode()` on purpose: a `decode()` promise
   * created while the image had not started fetching stays pending in
   * Chrome even after the image finishes loading, and awaiting that stranded
   * the advance and stopped autoplay for good.
   */
  async function waitForLoad(wrapper: HTMLDivElement | null) {
    const el = getMediaEl(wrapper);
    if (!(el instanceof HTMLImageElement) || el.complete) return;

    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        el.removeEventListener("load", done);
        el.removeEventListener("error", done);
        resolve();
      };
      // `done` only ever runs asynchronously, so reading `timer` from it is safe.
      const timer = setTimeout(done, LOAD_TIMEOUT_MS);
      el.addEventListener("load", done);
      el.addEventListener("error", done);
    });
  }

  async function goTo(next: number) {
    if (isAnimatingRef.current || next === currentIndexRef.current || count <= 1) return;
    const prev = currentIndexRef.current;

    const prevLayer = layerRefs.current[prev];
    const nextLayer = layerRefs.current[next];
    const prevMedia = mediaRefs.current[prev];
    const nextMedia = mediaRefs.current[next];
    // The hold that triggered this advance has already fired and is spent,
    // so any bail-out from here on must re-arm it or autoplay stops for good.
    if (!prevLayer || !nextLayer || !prevMedia || !nextMedia) {
      armHold();
      return;
    }

    isAnimatingRef.current = true;
    holdTweenRef.current?.kill();
    holdTweenRef.current = null;

    // Covers a dot click (and reduced motion, where nothing pre-warms) to an
    // item the hold never reached.
    warmUp(next);
    await waitForLoad(nextMedia);

    const nextVideo = videoRefs.current[next];
    const prevVideo = videoRefs.current[prev];
    nextVideo?.play().catch(() => {});

    currentIndexRef.current = next;
    setActiveIndex(next);

    const reduced = reducedMotionRef.current;
    const duration = reduced ? REDUCED_SECONDS : WIPE_SECONDS;

    gsap.set(nextLayer, { zIndex: 2, visibility: "visible" });
    gsap.set(prevLayer, { zIndex: 1 });

    const tl = gsap.timeline({
      defaults: { ease: reduced ? "power1.out" : "figmaInOut" },
      onComplete: () => {
        gsap.set(prevLayer, {
          clipPath: "inset(0 0 0 100%)",
          visibility: "hidden",
          zIndex: 0,
          autoAlpha: 1,
        });
        gsap.set(nextLayer, { zIndex: 1 });
        gsap.set(prevMedia, { clearProps: "transform" });
        if (prevVideo) {
          prevVideo.pause();
          try {
            prevVideo.currentTime = 0;
          } catch {
            // Some browsers throw if the video isn't seekable yet.
          }
        }
        isAnimatingRef.current = false;
        armHold();
      },
    });

    if (reduced) {
      tl.set(nextLayer, { clipPath: "inset(0 0 0 0%)" });
      tl.set(nextMedia, { scale: 1, xPercent: 0 });
      tl.fromTo(nextLayer, { autoAlpha: 0 }, { autoAlpha: 1, duration }, 0);
      tl.to(prevLayer, { autoAlpha: 0, duration }, 0);
    } else {
      tl.fromTo(
        nextMedia,
        { scale: 0.632, xPercent: 13.69 },
        { scale: 1, xPercent: 0, duration, transformOrigin: "center center" },
        0
      );
      tl.to(nextLayer, { clipPath: "inset(0 0 0 0%)", duration }, 0);
    }
  }

  // Declared after the functions it calls, so the autoplay loop is fully
  // defined before GSAP arms the first hold.
  useGSAP(
    () => {
      if (count <= 1) return;
      armHold();
      return () => {
        holdTweenRef.current?.kill();
      };
    },
    { scope: sectionRef, dependencies: [count] }
  );

  const showControls = count > 1;

  return (
    <section
      ref={sectionRef}
      aria-roledescription={count > 1 ? "carousel" : undefined}
      aria-label={count > 1 ? "Featured" : undefined}
      className="relative h-[34rem] min-h-[28rem] max-h-[85dvh] w-full overflow-hidden bg-ink lg:h-[47rem] lg:min-h-[32rem]"
    >
      {carousel.map((item, i) => {
        const isFirst = i === 0;
        return (
          <div
            key={i}
            ref={setLayerRef(i)}
            role={count > 1 ? "group" : undefined}
            aria-roledescription={count > 1 ? "slide" : undefined}
            aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
            className="absolute inset-0"
            style={
              isFirst
                ? { zIndex: 1 }
                : { clipPath: "inset(0 0 0 100%)", visibility: "hidden", zIndex: 0 }
            }
          >
            <div
              ref={setMediaRef(i)}
              className="absolute"
              style={{ left: "-0.35%", top: "-29.12%", width: "158.39%", height: "158.24%" }}
            >
              <CmsMedia
                ref={setVideoRef(i)}
                media={item.media}
                poster={item.poster}
                alt={item.media?.alt}
                sizes="160vw"
                preload={isFirst}
                // Item 1 is due 3s after load, too soon to rely on warmUp();
                // the rest stay lazy and are warmed one hold ahead of use.
                loading={i === 1 ? "eager" : undefined}
              />
            </div>
          </div>
        );
      })}

      {/* Left -> right dark gradient overlay, constant across items. */}
      <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-r from-black/60 to-transparent" />

      <Container className="relative z-[4] flex h-full flex-col justify-center gap-8 pb-[7.5rem] lg:pb-[6.75rem]">
        <div className="flex max-w-[34.25rem] flex-col gap-6">
          <HighlightedText
            as="h1"
            value={heading}
            className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.05rem] text-white lg:text-[4.25rem] lg:leading-[4.845rem] lg:tracking-[-0.1147rem]"
          />

          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-3 lg:gap-4">
              {buttons.map((button, bi) => (
                <CmsButton
                  key={`${button.text}-${bi}`}
                  button={button}
                  variant={ctaVariant(button.variant)}
                  // Figma's red hero CTA carries a trailing arrow in
                  // addition to its (CMS-managed) leading icon.
                  trailing={
                    button.variant === "red" ? <CmsIcon media={ARROW_ICON} size={16} /> : null
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      {showControls && (
        <div className="absolute right-4 top-4 z-[5] flex items-center justify-end gap-3 lg:right-20 lg:top-8">
          <PlayPauseButton
            paused={userPaused}
            onToggle={toggleUserPause}
            tone="onDark"
          />

          <div className="flex items-center gap-2">
            {carousel.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => void goTo(i)}
                aria-label={`Go to slide ${i + 1} of ${count}`}
                aria-current={i === activeIndex}
                className={`h-2 w-2 rounded-full transition-[width,background-color] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  i === activeIndex ? "w-6 bg-brand" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {stats.length > 0 && (
        <div className="absolute inset-x-4 bottom-4 z-[4] overflow-hidden rounded-[1rem] bg-black/20 lg:inset-x-20 lg:bottom-9">
          <dl className="grid grid-cols-2 lg:flex lg:flex-row lg:items-stretch">
            {stats.map((stat, i) => (
              // Equal-width columns across the bar; value and label are
              // centred on each other but sit at the column's left padding.
              <div key={`${stat.label}-${i}`} className="flex items-stretch lg:flex-1">
                <div className="flex w-fit flex-col items-center gap-1 px-6 py-6 text-center lg:mr-auto">
                  <dd className="order-1 text-[1.625rem] font-semibold tracking-[-0.02714rem] text-white">
                    {stat.value}
                  </dd>
                  <dt className="order-2 text-[0.6875rem] uppercase tracking-[0.1278rem] text-white">
                    {stat.label}
                  </dt>
                </div>
                {i < stats.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden h-[3.1875rem] w-px self-center bg-white/30 lg:block"
                  />
                )}
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
