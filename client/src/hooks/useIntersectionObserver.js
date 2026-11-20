import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver({
  threshold = 0.05,
  rootMargin = '0px',
  triggerOnce = true,
  initiallyVisible = false,
} = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(initiallyVisible);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // Immediately check if element is already within viewport
    try {
      const rect = node.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        setIsVisible(true);
        if (triggerOnce) {
          return;
        }
      }
    } catch {
      // Fall through to IntersectionObserver
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(node);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}
