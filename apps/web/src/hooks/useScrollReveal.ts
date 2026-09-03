import { useEffect, useRef, type RefObject } from 'react';

/**
 * Adds a subtle scroll-reveal animation to a single element using
 * IntersectionObserver. Pairs with the `.reveal` / `.reveal.is-visible`
 * CSS classes defined in index.css.
 *
 * Behavior follows minimalist-ui protocol:
 *   - translateY(12px) → 0, opacity 0 → 1
 *   - 600ms cubic-bezier(0.16, 1, 0.3, 1)
 *   - triggered once per element
 *   - respects prefers-reduced-motion via CSS
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Bail early when user prefers reduced motion; CSS handles the rest.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }

    // If IntersectionObserver isn't available, just show the element.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    el.classList.add('reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
