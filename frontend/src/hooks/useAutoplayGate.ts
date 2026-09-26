"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

type AutoplayGateOptions = {
  /** False disables autoplay outright (e.g. a single slide — nothing to advance to). */
  enabled?: boolean;
  /** Also pause while a pointer rests on the target. */
  pauseOnHover?: boolean;
  /** Fires whenever the verdict flips, so timer-driven callers can re-gate. */
  onChange?: (allowed: boolean) => void;
};

/**
 * THE shared "may this carousel advance right now?" verdict, used by every
 * auto-advancing section (hero, industries).
 *
 * Autoplay stops for a hidden tab, a section scrolled out of view, keyboard
 * focus inside it, `prefers-reduced-motion`, optionally a hovering pointer,
 * and the caller's own pause button — which every autoplaying section must
 * provide (WCAG 2.2.2 Pause, Stop, Hide).
 *
 * The verdict is exposed as a ref, not state, so animation and timer
 * callbacks can read it without being re-created on every change; `onChange`
 * is the hook into a caller's own scheduler.
 */
export function useAutoplayGate(
  targetRef: RefObject<HTMLElement | null>,
  { enabled = true, pauseOnHover = false, onChange }: AutoplayGateOptions = {}
) {
  const reducedMotionRef = useRef(false);
  const pageVisibleRef = useRef(true);
  const intersectingRef = useRef(true);
  const focusedRef = useRef(false);
  const hoveredRef = useRef(false);
  const userPausedRef = useRef(false);
  const allowedRef = useRef(false);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  // Kept in a ref so a caller can pass an inline callback without
  // re-subscribing every listener on each render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const evaluate = useCallback(() => {
    const allowed =
      enabled &&
      !reducedMotionRef.current &&
      !userPausedRef.current &&
      pageVisibleRef.current &&
      intersectingRef.current &&
      !focusedRef.current &&
      !(pauseOnHover && hoveredRef.current);

    if (allowed === allowedRef.current) return;
    allowedRef.current = allowed;
    onChangeRef.current?.(allowed);
  }, [enabled, pauseOnHover]);

  useEffect(() => {
    const target = targetRef.current;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      reducedMotionRef.current = motionQuery.matches;
      setReducedMotion(motionQuery.matches);
      evaluate();
    };

    const onVisibility = () => {
      pageVisibleRef.current = document.visibilityState === "visible";
      evaluate();
    };

    const syncFocus = () => {
      const focused = document.activeElement;
      focusedRef.current =
        !!target &&
        !!focused &&
        target.contains(focused) &&
        // The play/pause control is exempt: focusing it is how a viewer asks
        // for playback, so it must not be what keeps playback paused.
        !focused.closest("[data-autoplay-control]");
      evaluate();
    };
    const onFocusIn = () => syncFocus();
    // Deferred so focus moving between two children inside the target doesn't
    // momentarily register as "left".
    const onFocusOut = () => requestAnimationFrame(syncFocus);

    const onPointerEnter = () => {
      hoveredRef.current = true;
      evaluate();
    };
    const onPointerLeave = () => {
      hoveredRef.current = false;
      evaluate();
    };

    let observer: IntersectionObserver | undefined;
    if (target) {
      observer = new IntersectionObserver(
        (entries) => {
          intersectingRef.current = entries[0]?.isIntersecting ?? true;
          evaluate();
        },
        { threshold: 0.3 }
      );
      observer.observe(target);
    }

    motionQuery.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibility);
    target?.addEventListener("focusin", onFocusIn);
    target?.addEventListener("focusout", onFocusOut);
    if (pauseOnHover) {
      target?.addEventListener("pointerenter", onPointerEnter);
      target?.addEventListener("pointerleave", onPointerLeave);
    }

    // Seed every condition from the live environment, then publish a verdict.
    reducedMotionRef.current = motionQuery.matches;
    setReducedMotion(motionQuery.matches);
    pageVisibleRef.current = document.visibilityState === "visible";
    evaluate();

    return () => {
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      target?.removeEventListener("focusin", onFocusIn);
      target?.removeEventListener("focusout", onFocusOut);
      target?.removeEventListener("pointerenter", onPointerEnter);
      target?.removeEventListener("pointerleave", onPointerLeave);
      observer?.disconnect();
    };
  }, [targetRef, evaluate, pauseOnHover]);

  const toggleUserPause = useCallback(() => {
    userPausedRef.current = !userPausedRef.current;
    setUserPaused(userPausedRef.current);
    evaluate();
  }, [evaluate]);

  return { allowedRef, reducedMotionRef, reducedMotion, userPaused, toggleUserPause };
}
