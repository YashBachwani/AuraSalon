import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Scissors, Sparkles, Ticket, Users, Wifi } from 'lucide-react';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatTime24To12, getInitials } from '../utils/formatters.js';

export function HomePage() {
  const { bootstrap, loading, error, socketStatus, refreshBootstrap } = useConnection();
  const { t } = useLanguage();

  const salon = bootstrap?.salon;
  const barbers = (bootstrap?.barbers || []).filter((b) => b.isOnDuty);

  return (
    <CustomerLayout maxWidth="max-w-4xl">
      {loading && !bootstrap ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !bootstrap ? (
        <ErrorState onRetry={() => refreshBootstrap()} />
      ) : (
        <div className="space-y-6">
          {/* Hero & Live Status Card */}
          <Card elevated goldAccent className="overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="gold" dot>
                  {t('home.badge')}
                </Badge>
                {salon ? (
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-salon-textSecondary tabular-nums">
                    <Clock className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                    <span>
                      {t('home.openToday', {
                        open: formatTime24To12(salon.openTime),
                        close: formatTime24To12(salon.closeTime),
                      })}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 max-w-2xl">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-salon-text leading-tight">
                  {t('home.heroTitle')}
                </h1>
                <p className="text-sm sm:text-base text-salon-textSecondary leading-relaxed">
                  {t('home.heroDescription')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link to="/join" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" fullWidth rightIcon={ArrowRight}>
                    {t('home.ctaJoin')}
                  </Button>
                </Link>
                <Link to="/status/demo" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth leftIcon={Ticket}>
                    {t('home.ctaViewStatus')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Live Backend Metrics Strip */}
          <section aria-label={t('home.liveOverview')} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-salon-goldMuted border border-salon-gold/30 shrink-0">
                  <Sparkles className="h-5 w-5 text-salon-gold" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-salon-textMuted">{t('home.configuredServices')}</p>
                  <p className="mt-0.5 text-2xl font-bold text-salon-text tabular-nums">
                    {bootstrap?.counts?.activeServices ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                  <Users className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-salon-textMuted">{t('home.barbersOnDuty')}</p>
                  <p className="mt-0.5 text-2xl font-bold text-salon-text tabular-nums">
                    {bootstrap?.counts?.onDutyBarbers ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 shrink-0">
                  <Wifi className="h-5 w-5 text-sky-300" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-salon-textMuted">{t('home.syncStatus')}</p>
                  <p className="mt-1 text-sm font-semibold text-salon-text">
                    {socketStatus === 'live'
                      ? t('connection.serverOnline')
                      : t('connection.reconnecting')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Barbers on Duty Roster */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-salon-text flex items-center gap-2">
                <Scissors className="h-5 w-5 text-salon-gold" aria-hidden="true" />
                <span>{t('home.barberRosterTitle')}</span>
              </h2>
              <Badge tone="neutral">
                {t('common.onDutyBarbersCount', { count: barbers.length })}
              </Badge>
            </div>

            {barbers.length === 0 ? (
              <EmptyState compact title={t('home.barberRosterEmpty')} icon={Scissors} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbers.map((barber) => (
                  <Card key={barber.id} className="hover:border-salon-gold/40">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-salon-deep shrink-0"
                        style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                      >
                        {getInitials(barber.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-salon-text truncate">{barber.name}</h3>
                          <BarberAvailabilityBadge availability={barber.availability} />
                        </div>
                        <p className="mt-1 text-xs text-salon-textMuted truncate">{barber.specialty}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Stage 1 Honest Readiness Notice */}
          <Card elevated className="border-salon-border/80">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-salon-gold">{t('common.stageNoticeTitle')}</p>
                <p className="mt-1 text-xs sm:text-sm text-salon-textMuted">{t('common.stageNoticeBody')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </CustomerLayout>
  );
}
