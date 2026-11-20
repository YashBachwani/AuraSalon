import { useIntersectionObserver } from '../../hooks/useIntersectionObserver.js';

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 700,
  threshold = 0.05,
  initiallyVisible = false,
  className = '',
  as: Component = 'div',
  ...rest
}) {
  const [ref, isVisible] = useIntersectionObserver({ threshold, initiallyVisible });

  const getTransformClasses = () => {
    if (isVisible) return 'opacity-100 translate-x-0 translate-y-0 scale-100';

    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-8 scale-[0.99]';
      case 'down':
        return '-translate-y-8 opacity-0 scale-[0.99]';
      case 'left':
        return 'translate-x-8 opacity-0';
      case 'right':
        return '-translate-x-8 opacity-0';
      case 'zoom':
        return 'opacity-0 scale-95';
      default:
        return 'opacity-0';
    }
  };

  return (
    <Component
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={[
        'transition-all ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
        getTransformClasses(),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Component>
  );
}
