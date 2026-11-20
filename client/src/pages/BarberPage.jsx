import { Link, useParams } from 'react-router-dom';
import { Clock, Scissors, User } from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getInitials } from '../utils/formatters.js';

export function BarberPage() {
  const { name } = useParams();
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();

  const barbers = bootstrap?.barbers || [];
  const normalizedParam = String(name || '').trim().toLowerCase();
  const activeBarber = barbers.find(
    (b) => b.slug.toLowerCase() === normalizedParam || b.name.toLowerCase() === normalizedParam
  );

  return (
    <StaffLayout subtitle={t('barber.title')} maxWidth="max-w-3xl">
      {loading && !bootstrap ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !bootstrap ? (
        <ErrorState onRetry={() => refreshBootstrap()} />
      ) : (
        <div className="space-y-5 max-w-xl mx-auto">
          {/* Barber Switcher */}
          <Card elevated>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t('barber.switchBarber')}</CardTitle>
                <Badge tone="gold">{t('barber.stage5Badge')}</Badge>
              </div>
              <CardDescription>{t('barber.chooseBarberSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {barbers.map((barber) => {
                const isSelected = activeBarber?.id === barber.id;
                return (
                  <Link
                    key={barber.id}
                    to={`/barber/${barber.slug}`}
                    className={[
                      'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border text-sm font-semibold transition-colors',
                      isSelected
                        ? 'bg-salon-gold text-salon-deep border-salon-gold'
                        : 'bg-salon-card text-salon-textSecondary border-salon-border hover:text-salon-text hover:border-salon-gold/40',
                    ].join(' ')}
                  >
                    <Scissors className="h-4 w-4" aria-hidden="true" />
                    <span>{barber.name}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {activeBarber ? (
            <>
              {/* Active Barber Identity Card */}
              <Card elevated goldAccent>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-base font-extrabold text-salon-deep shrink-0"
                      style={{ backgroundColor: activeBarber.avatarColor || '#D4A017' }}
                    >
                      {getInitials(activeBarber.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-salon-textMuted">
                        {t('barber.activeBarberLabel')}
                      </p>
                      <h1 className="text-2xl font-extrabold text-salon-text truncate">
                        {activeBarber.name}
                      </h1>
                      <p className="text-xs text-salon-textSecondary truncate">
                        {activeBarber.specialty}
                      </p>
                    </div>
                  </div>
                  <BarberAvailabilityBadge availability={activeBarber.availability} size="lg" />
                </CardContent>
              </Card>

              {/* Current Chair Panel */}
              <EmptyState
                icon={User}
                title={t('barber.emptyChairTitle')}
                description={t('barber.emptyChairDescription')}
              />

              {/* Next Customer Preview Shell */}
              <Card elevated>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                    <span>{t('barber.nextCustomerTitle')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-salon-textSecondary leading-relaxed">
                    {t('barber.stage5Description')}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={Scissors}
              title={t('barber.chooseBarberTitle')}
              description={t('barber.chooseBarberSubtitle')}
            />
          )}
        </div>
      )}
    </StaffLayout>
  );
}
