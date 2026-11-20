import { ScrollReveal } from './ScrollReveal.jsx';

export function SectionHeading({
  eyebrow = null,
  title,
  description = null,
  align = 'center',
  serif = true,
  className = '',
}) {
  const isCenter = align === 'center';

  return (
    <div
      className={[
        'space-y-3 max-w-3xl',
        isCenter ? 'mx-auto text-center' : 'text-left',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? (
        <ScrollReveal delay={0}>
          <div
            className={[
              'inline-flex items-center gap-2 rounded-full border border-salon-gold/30 bg-salon-gold/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-salon-gold',
              isCenter ? 'mx-auto' : '',
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-salon-gold animate-pulse" />
            <span>{eyebrow}</span>
          </div>
        </ScrollReveal>
      ) : null}

      <ScrollReveal delay={100}>
        <h2
          className={[
            'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-salon-text leading-tight',
            serif ? 'font-serif' : 'font-sans',
          ].join(' ')}
        >
          {title}
        </h2>
      </ScrollReveal>

      {description ? (
        <ScrollReveal delay={200}>
          <p className="text-sm sm:text-base lg:text-lg text-salon-textMuted leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </ScrollReveal>
      ) : null}
    </div>
  );
}

