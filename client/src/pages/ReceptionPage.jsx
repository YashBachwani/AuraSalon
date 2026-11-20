import { useState } from 'react';
import { Scissors, Search, Users } from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getInitials } from '../utils/formatters.js';

export function ReceptionPage() {
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const barbers = bootstrap?.barbers || [];

  return (
    <StaffLayout subtitle={t('reception.title')} maxWidth="max-w-7xl">
      {loading && !bootstrap ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !bootstrap ? (
        <ErrorState onRetry={() => refreshBootstrap()} />
      ) : (
        <div className="space-y-5">
          {/* Operational Header Strip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-salon-text">
                  {t('reception.title')}
                </h1>
                <Badge tone="gold">{t('reception.stage4Badge')}</Badge>
              </div>
              <p className="mt-1 text-sm text-salon-textMuted">{t('reception.subtitle')}</p>
            </div>

            <div className="w-full md:w-80">
              <Input
                id="reception-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('reception.searchPlaceholder')}
                rightSlot={<Search className="h-4 w-4 text-salon-textMuted" aria-hidden="true" />}
              />
            </div>
          </div>

          {/* Tablet Landscape Split (10-inch optimized: 5 cols left / 7 cols right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANEL: Barber Cards */}
            <section className="lg:col-span-5 space-y-3" aria-label={t('reception.barbersPanelTitle')}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-salon-text flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                  <span>{t('reception.barbersPanelTitle')}</span>
                </h2>
                <Badge tone="neutral">
                  {t('common.onDutyBarbersCount', {
                    count: barbers.filter((b) => b.isOnDuty).length,
                  })}
                </Badge>
              </div>

              <div className="space-y-3">
                {barbers.map((barber) => (
                  <Card key={barber.id} elevated>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-salon-deep shrink-0"
                          style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                        >
                          {getInitials(barber.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-salon-text truncate">{barber.name}</p>
                          <p className="text-xs text-salon-textMuted truncate">{barber.specialty}</p>
                        </div>
                      </div>
                      <BarberAvailabilityBadge availability={barber.availability} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* RIGHT PANEL: Waiting Queue Table Shell */}
            <section className="lg:col-span-7 space-y-3" aria-label={t('reception.queuePanelTitle')}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-salon-text flex items-center gap-2">
                  <Users className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                  <span>{t('reception.queuePanelTitle')}</span>
                </h2>
                <Badge tone="emerald" dot>
                  {t('status.salon.open')}
                </Badge>
              </div>

              <Card elevated>
                <CardHeader>
                  <CardTitle className="text-sm text-salon-textSecondary">
                    {t('reception.stage4Description')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    compact
                    icon={Users}
                    title={t('reception.emptyQueueTitle')}
                    description={t('reception.emptyQueueDescription')}
                  />
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
