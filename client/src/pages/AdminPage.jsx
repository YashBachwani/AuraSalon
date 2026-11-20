import { useState } from 'react';
import { BarChart3, Clock, Scissors, Settings, Sparkles } from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatTime24To12, getInitials } from '../utils/formatters.js';

export function AdminPage() {
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('stats');

  const tabs = [
    { id: 'stats', label: t('admin.tabStats'), icon: BarChart3 },
    { id: 'services', label: t('admin.tabServices'), icon: Sparkles },
    { id: 'barbers', label: t('admin.tabBarbers'), icon: Scissors },
    { id: 'settings', label: t('admin.tabSettings'), icon: Settings },
  ];

  const kpis = [
    { key: 'served', label: t('admin.kpiServed'), value: '0' },
    { key: 'waiting', label: t('admin.kpiWaiting'), value: '0' },
    { key: 'avgWait', label: t('admin.kpiAvgWait'), value: '—' },
    { key: 'noShows', label: t('admin.kpiNoShows'), value: '0' },
    { key: 'cancelled', label: t('admin.kpiCancelled'), value: '0' },
    { key: 'servicesDone', label: t('admin.kpiServicesDone'), value: '0' },
  ];

  const salon = bootstrap?.salon;
  const barbers = bootstrap?.barbers || [];

  return (
    <StaffLayout subtitle={t('admin.title')} maxWidth="max-w-6xl">
      {loading && !bootstrap ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !bootstrap ? (
        <ErrorState onRetry={() => refreshBootstrap()} />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-salon-text">
                {t('admin.title')}
              </h1>
              <p className="mt-1 text-sm text-salon-textMuted">{t('admin.subtitle')}</p>
            </div>
            <Badge tone="gold">{t('admin.stage6Badge')}</Badge>
          </div>

          {/* Section Tabs */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label={t('admin.title')}
          >
            {tabs.map(({ id, label, icon: Icon }) => {
              const selected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(id)}
                  className={[
                    'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors',
                    selected
                      ? 'bg-salon-gold text-salon-deep border-salon-gold'
                      : 'bg-salon-deep text-salon-textSecondary border-salon-border hover:text-salon-text hover:bg-salon-card',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View */}
          {activeTab === 'stats' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <Card key={kpi.key} elevated>
                    <CardContent className="p-5">
                      <p className="text-xs font-medium text-salon-textMuted">{kpi.label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-salon-text tabular-nums">
                        {kpi.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card elevated>
                <CardContent className="p-5 text-sm text-salon-textSecondary">
                  {t('admin.stage6Description')}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'services' ? (
            <Card elevated>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{t('admin.tabServices')}</CardTitle>
                  <Badge tone="neutral">
                    {t('common.activeServicesCount', { count: bootstrap?.counts?.activeServices ?? 0 })}
                  </Badge>
                </div>
                <CardDescription>{t('admin.stage6Description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-salon-textMuted">{t('common.stageNoticeBody')}</p>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'barbers' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {barbers.map((barber) => (
                <Card key={barber.id} elevated>
                  <CardContent className="p-5 flex items-center justify-between gap-3">
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
          ) : null}

          {activeTab === 'settings' ? (
            <Card elevated>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                  <span>{t('admin.tabSettings')}</span>
                </CardTitle>
                <CardDescription>
                  {salon
                    ? t('admin.hoursSummary', {
                        open: formatTime24To12(salon.openTime),
                        close: formatTime24To12(salon.closeTime),
                      })
                    : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-salon-textSecondary">{t('admin.stage6Description')}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </StaffLayout>
  );
}
