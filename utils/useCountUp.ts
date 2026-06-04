import { useEffect, useRef, useState } from 'react';

/**
 * Animated count-up hook — Financial Dashboard best practice (ui-ux-pro-max).
 * Smoothly animates a number from 0 (or previous value) to the target.
 * Respects prefers-reduced-motion: returns the final value instantly.
 *
 * @param target   The number to animate to
 * @param duration Animation duration in ms (default 800)
 * @returns The current animated value
 */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced motion — snap to final value
    const prefersReduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const from = prevTarget.current;
    const to = target;
    prevTarget.current = target;

    if (prefersReduced || from === to || !isFinite(to)) {
      setValue(to);
      return;
    }

    const start = performance.now();
    // easeOutExpo — fast start, smooth settle
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = from + (to - from) * ease(progress);
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(to);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
