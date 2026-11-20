import { Bell, Clock, Sparkles, Ticket, Users } from 'lucide-react';
import { Badge } from './Badge.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function QueuePreviewCard({ className = '' }) {
  const { t } = useLanguage();

  return (
    <div
      className={[
        'luxury-card-gold relative overflow-hidden rounded-3xl p-6 sm:p-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Decorative Gold Header Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-salon-gold/20 pb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-salon-gold animate-pulse" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-salon-gold">
            {t('home.previewBadge') || 'Queue Experience Preview (Simulated Interface)'}
          </span>
        </div>
        <Badge tone="gold" size="sm">
          {t('home.demoNotice') || 'Preview Mode'}
        </Badge>
      </div>

      {/* Main Preview Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Token Card */}
        <div className="rounded-2xl border border-salon-gold/30 bg-black/40 p-5 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-salon-textMuted">
            <Ticket className="h-3.5 w-3.5 text-salon-gold" />
            <span>{t('home.previewYourToken') || 'Your Live Token'}</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-salon-gold tabular-nums">
            S-14
          </div>
          <Badge tone="emerald" dot size="sm">
            {t('status.queue.WAITING')}
          </Badge>
        </div>

        {/* Real-time Indicators */}
        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-salon-textMuted">
                <Users className="h-4 w-4 text-sky-400" />
                <span>{t('home.previewPeopleAhead') || 'Ahead in Line'}</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-salon-text tabular-nums">
                2 {t('home.previewPeople') || 'people'}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-salon-textMuted">
                <Clock className="h-4 w-4 text-salon-gold" />
                <span>{t('home.previewEstimatedWait') || 'Approx. Wait'}</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-salon-gold tabular-nums">
                ~25 min
              </div>
            </div>
          </div>

          {/* Turn Alert Banner Simulation */}
          <div className="rounded-xl border border-salon-gold/40 bg-salon-gold/10 p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-salon-gold text-salon-deep shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-salon-gold uppercase tracking-wider">
                {t('home.previewNotificationTitle') || 'Real-Time Turn Alert'}
              </p>
              <p className="text-xs text-salon-textSecondary truncate">
                {t('home.previewNotificationBody') || "You're almost next! Start coming to the salon."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Disclaimer */}
      <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-salon-textMuted text-center">
        {t('home.previewDisclaimer') || 'Values shown above represent the customer tracking experience on /status/:id.'}
      </div>
    </div>
  );
}
