import { Scissors, Sparkles } from 'lucide-react';
import { DisplayLayout } from '../layouts/DisplayLayout.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getInitials } from '../utils/formatters.js';

export function DisplayPage() {
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();

  const barbers = (bootstrap?.barbers || []).filter((b) => b.isOnDuty);

  return (
    <DisplayLayout>
      {loading && !bootstrap ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message={t('common.loading')} className="w-full max-w-md" />
        </div>
      ) : error && !bootstrap ? (
        <div className="flex-1 flex items-center justify-center">
          <ErrorState onRetry={() => refreshBootstrap()} className="w-full max-w-md" />
        </div>
      ) : (
        <>
          {/* Active Barber Cards — Primary TV Focus (~64% height on 1080p) */}
          <section
            aria-label={t('display.nowServingTitle')}
            className="flex-1 min-h-0 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg lg:text-2xl font-extrabold uppercase tracking-wider text-salon-gold flex items-center gap-2.5">
                <Scissors className="h-6 w-6" aria-hidden="true" />
                <span>{t('display.nowServingTitle')}</span>
              </h1>
              <Badge tone="neutral" size="lg">
                {t('common.onDutyBarbersCount', { count: barbers.length })}
              </Badge>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {barbers.map((barber) => (
                <Card
                  key={barber.id}
                  className="bg-salon-bg border-2 border-salon-border flex flex-col justify-between p-6 lg:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full text-lg lg:text-2xl font-extrabold text-salon-deep shrink-0"
                        style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                      >
                        {getInitials(barber.name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-2xl lg:text-3xl font-extrabold text-salon-text truncate">
                          {barber.name}
                        </h2>
                        <p className="text-sm lg:text-base text-salon-textMuted truncate">
                          {barber.specialty}
                        </p>
                      </div>
                    </div>
                    <BarberAvailabilityBadge availability={barber.availability} size="lg" />
                  </div>

                  <div className="my-6 text-center">
                    <div className="text-5xl lg:text-7xl font-black tracking-tight text-salon-gold tabular-nums leading-none">
                      {barber.availability === 'ON_BREAK'
                        ? t('display.onBreakLabel')
                        : t('display.readyLabel')}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-salon-border/80 flex items-center justify-between text-sm lg:text-base text-salon-textSecondary">
                    <span>{t('brand.defaultName')}</span>
                    <span className="font-semibold text-salon-textMuted tabular-nums">—</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Upcoming Queue Strip (~26% height on 1080p) */}
          <section
            aria-label={t('display.upcomingTitle')}
            className="shrink-0 rounded-2xl border border-salon-border bg-salon-bg/95 p-5 lg:p-6 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-salon-gold" aria-hidden="true" />
                <h2 className="text-lg lg:text-xl font-extrabold uppercase tracking-wider text-salon-text">
                  {t('display.upcomingTitle')}
                </h2>
                <span className="text-xs lg:text-sm text-salon-textMuted">
                  — {t('display.upcomingSubtitle')}
                </span>
              </div>
              <Badge tone="gold">{t('barber.stage5Badge')}</Badge>
            </div>

            <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-salon-border/80 bg-salon-deep/80 px-5 py-4">
              <p className="text-base lg:text-xl font-semibold text-salon-textSecondary">
                {t('display.emptyUpcoming')}
              </p>
              <p className="text-xs lg:text-sm text-salon-textMuted">{t('display.stage5Notice')}</p>
            </CardContent>
          </section>
        </>
      )}
    </DisplayLayout>
  );
}
