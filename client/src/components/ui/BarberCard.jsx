import { AlertCircle, Check, Scissors } from 'lucide-react';
import { BarberAvailabilityBadge } from './Badge.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getInitials } from '../../utils/formatters.js';
import { getBarberImage } from '../../utils/salonImages.js';

export function BarberCard({
  barber,
  selected = false,
  onSelect = null,
  selectable = false,
  className = '',
}) {
  const { t } = useLanguage();
  const imageUrl = getBarberImage(barber.slug);
  const isOnBreak = barber.availability === 'ON_BREAK';
  const isOffDuty = barber.availability === 'OFF_DUTY' || !barber.isOnDuty;
  const isSelectableDisabled = selectable && (isOnBreak || isOffDuty);

  const handleClick = () => {
    if (selectable && !isSelectableDisabled && onSelect) {
      onSelect(barber);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
      aria-disabled={isSelectableDisabled}
      tabIndex={selectable && !isSelectableDisabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (selectable && !isSelectableDisabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={[
        'group relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col justify-between',
        selectable ? 'cursor-pointer select-none focus:outline-none' : '',
        selected
          ? 'border-salon-gold bg-salon-gold/10 shadow-goldGlow ring-1 ring-salon-gold/50'
          : 'border-white/10 bg-[#1C1C1C] hover:border-salon-gold/40 hover:bg-[#222222]',
        isSelectableDisabled ? 'opacity-50 cursor-not-allowed hover:border-white/10' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top Banner & Photo */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={barber.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-3xl font-bold text-salon-deep"
            style={{ backgroundColor: barber.avatarColor || '#D4AF70' }}
          >
            {getInitials(barber.name)}
          </div>
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/30 to-transparent"
          aria-hidden="true"
        />

        {/* Status Pill Top Left */}
        <div className="absolute top-3 left-3">
          <BarberAvailabilityBadge availability={barber.availability} size="sm" />
        </div>

        {/* Selected Checkmark Top Right */}
        {selectable && selected ? (
          <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-salon-gold text-salon-deep shadow-md">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-salon-text group-hover:text-salon-gold transition-colors truncate">
            {barber.name}
          </h3>
          <Scissors className="h-4 w-4 text-salon-gold shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>

        <p className="text-xs text-salon-textMuted line-clamp-1">{barber.specialty}</p>

        {selectable && isOnBreak ? (
          <div className="pt-2 flex items-center gap-1.5 text-xs text-amber-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] leading-tight">
              {t('join.barberOnBreakDisabled') || 'On break — not accepting new bookings'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

