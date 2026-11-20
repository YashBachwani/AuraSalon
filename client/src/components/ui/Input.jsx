import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    id,
    label,
    prefix = null,
    helperText = null,
    error = null,
    rightSlot = null,
    className = '',
    containerClassName = '',
    ...rest
  },
  ref
) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-salon-textSecondary">
          {label}
        </label>
      ) : null}

      <div
        className={[
          'flex items-center min-h-[44px] rounded-xl border bg-salon-deep/90 transition-colors',
          error
            ? 'border-rose-500/80 focus-within:border-rose-400'
            : 'border-salon-border focus-within:border-salon-gold',
        ].join(' ')}
      >
        {prefix ? (
          <span className="pl-3.5 pr-2 text-sm font-medium text-salon-textMuted select-none border-r border-salon-border/80">
            {prefix}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          className={[
            'w-full bg-transparent px-3.5 py-2.5 text-sm text-salon-text placeholder:text-salon-textMuted/70',
            'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          {...rest}
        />

        {rightSlot ? <div className="pr-3 shrink-0">{rightSlot}</div> : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-400" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-salon-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
});
