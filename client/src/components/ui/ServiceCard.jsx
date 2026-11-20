import { Check, Clock, Plus, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatInr } from '../../utils/formatters.js';
import { getServiceImage } from '../../utils/salonImages.js';

export function ServiceCard({
  service,
  selected = false,
  onToggle = null,
  selectable = false,
  disabled = false,
  className = '',
}) {
  const { getLocalizedName, t } = useLanguage();
  const serviceName = getLocalizedName(service.nameEn, service.nameGu);
  const imageUrl = getServiceImage(service.id);

  const handleClick = () => {
    if (selectable && !disabled && onToggle) {
      onToggle(service);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={selectable ? 'checkbox' : undefined}
      aria-checked={selectable ? selected : undefined}
      aria-disabled={disabled}
      tabIndex={selectable && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (selectable && !disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={[
        'group relative overflow-hidden rounded-2xl border transition-all duration-300',
        selectable ? 'cursor-pointer select-none focus:outline-none' : '',
        selected
          ? 'border-salon-gold bg-salon-gold/10 shadow-goldGlow ring-1 ring-salon-gold/50'
          : 'border-white/10 bg-[#1C1C1C] hover:border-salon-gold/40 hover:bg-[#222222]',
        disabled && !selected ? 'opacity-40 cursor-not-allowed hover:border-white/10' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Image container with subtle zoom */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
        <img
          src={imageUrl}
          alt={serviceName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/40 to-transparent"
          aria-hidden="true"
        />

        {/* Duration badge */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-black/40 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md tabular-nums">
          <Clock className="h-3 w-3 text-salon-gold" aria-hidden="true" />
          <span>{service.durationMinutes} min</span>
        </div>

        {/* Selection checkmark / plus button */}
        {selectable ? (
          <div
            className={[
              'absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border transition-all',
              selected
                ? 'border-salon-gold bg-salon-gold text-salon-deep scale-110 shadow-lg'
                : 'border-white/20 bg-black/50 text-white/70 group-hover:border-salon-gold group-hover:text-salon-gold',
            ].join(' ')}
          >
            {selected ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : (
              <Plus className="h-4 w-4 stroke-[2]" />
            )}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-salon-text group-hover:text-salon-gold transition-colors truncate">
              {serviceName}
            </h3>
            <p className="mt-0.5 text-xs text-salon-textMuted">
              {t('services.expertCare') || 'Signature Salon Treatment'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-base sm:text-lg font-extrabold text-salon-gold tabular-nums">
              {formatInr(service.priceInr)}
            </span>
          </div>
        </div>

        {selectable && selected ? (
          <div className="pt-1 flex items-center gap-1 text-[11px] font-semibold text-salon-gold">
            <Sparkles className="h-3 w-3" />
            <span>{t('join.selectedLabel') || 'Selected'}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
