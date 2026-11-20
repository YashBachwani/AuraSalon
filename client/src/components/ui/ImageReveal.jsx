import { useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver.js';

export function ImageReveal({
  src,
  alt,
  containerClassName = '',
  imageClassName = '',
  aspectRatio = 'aspect-[4/3]',
  overlayGradient = true,
  parallax = false,
  ...rest
}) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      ref={ref}
      className={[
        'relative overflow-hidden rounded-2xl bg-salon-secondary/60 border border-white/5',
        aspectRatio,
        containerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={[
          'h-full w-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isVisible && isLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          imageClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />

      {overlayGradient ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

