import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-salon-gold text-salon-deep font-semibold hover:bg-salon-goldHover active:scale-[0.99] shadow-salon border border-salon-gold/80',
  secondary:
    'bg-salon-card text-salon-text font-medium hover:bg-salon-cardHover active:scale-[0.99] border border-salon-border',
  outline:
    'bg-transparent text-salon-text font-medium hover:bg-salon-card/70 active:scale-[0.99] border border-salon-border',
  danger:
    'bg-rose-500/15 text-rose-300 font-semibold hover:bg-rose-500/25 active:scale-[0.99] border border-rose-500/40',
  ghost:
    'bg-transparent text-salon-textSecondary font-medium hover:text-salon-text hover:bg-salon-card/60 border border-transparent',
};

const SIZES = {
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl',
  lg: 'min-h-[48px] px-5 py-3 text-base rounded-xl',
  xl: 'min-h-[56px] px-6 py-3.5 text-base rounded-2xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  leftIcon: LeftIcon = null,
  rightIcon: RightIcon = null,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : LeftIcon ? (
        <LeftIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
      {!loading && RightIcon ? <RightIcon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
}
