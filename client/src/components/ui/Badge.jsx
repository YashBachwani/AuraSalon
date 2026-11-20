import { useLanguage } from '../../context/LanguageContext.jsx';

const TONES = {
  gold: 'bg-salon-goldMuted text-salon-gold border-salon-gold/40',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
  neutral: 'bg-slate-500/15 text-salon-textSecondary border-salon-border',
};

const DOT_TONES = {
  gold: 'bg-salon-gold',
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  neutral: 'bg-salon-textMuted',
};

export function Badge({ children, tone = 'neutral', dot = false, size = 'sm', className = '' }) {
  const sizeClass =
    size === 'lg' ? 'px-3.5 py-1.5 text-sm gap-2' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={[
        'inline-flex items-center font-semibold rounded-full border whitespace-nowrap',
        TONES[tone] || TONES.neutral,
        sizeClass,
        className,
      ].join(' ')}
    >
      {dot ? <span className={`h-2 w-2 rounded-full ${DOT_TONES[tone] || DOT_TONES.neutral}`} /> : null}
      {children}
    </span>
  );
}

const BARBER_TONE_MAP = {
  AVAILABLE: 'emerald',
  BUSY: 'sky',
  ON_BREAK: 'amber',
  OFF_DUTY: 'neutral',
};

const QUEUE_TONE_MAP = {
  WAITING: 'neutral',
  CALLED: 'gold',
  IN_CHAIR: 'sky',
  DONE: 'emerald',
  NO_SHOW: 'rose',
  CANCELLED: 'rose',
};

export function BarberAvailabilityBadge({ availability, size = 'sm', className = '' }) {
  const { t } = useLanguage();
  return (
    <Badge tone={BARBER_TONE_MAP[availability] || 'neutral'} dot size={size} className={className}>
      {t(`status.barber.${availability}`)}
    </Badge>
  );
}

export function QueueStatusBadge({ status, size = 'sm', className = '' }) {
  const { t } = useLanguage();
  return (
    <Badge tone={QUEUE_TONE_MAP[status] || 'neutral'} dot size={size} className={className}>
      {t(`status.queue.${status}`)}
    </Badge>
  );
}
