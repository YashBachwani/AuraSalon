export function Card({ children, elevated = false, goldAccent = false, className = '', ...rest }) {
  return (
    <div
      className={[
        'rounded-2xl border shadow-salon transition-colors duration-150',
        elevated ? 'bg-salon-deep' : 'bg-salon-card/90',
        goldAccent ? 'border-salon-gold/60 shadow-goldGlow' : 'border-salon-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-5 pt-5 pb-3 border-b border-salon-border/70 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={`text-lg font-semibold tracking-tight text-salon-text ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`mt-1 text-sm text-salon-textMuted ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`px-5 py-4 border-t border-salon-border/70 ${className}`}>{children}</div>;
}
