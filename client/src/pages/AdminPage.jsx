import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  History,
  RefreshCw,
  Scissors,
  Settings,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatInr, formatTime12, formatTime24To12, getInitials, maskPhone } from '../utils/formatters.js';

export function AdminPage() {
  const { bootstrap, refreshBootstrap } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  const [activeTab, setActiveTab] = useState('stats');
  const [selectedRange, setSelectedRange] = useState('today'); // 'today' | '7d' | '30d' | 'all'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Time-based greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12
    ? t('admin.greetingMorning')
    : currentHour < 17
      ? t('admin.greetingAfternoon')
      : t('admin.greetingEvening');

  // Fetch Authoritative Owner Analytics from backend
  const fetchAnalytics = useCallback(async ({ silent = false, range = selectedRange } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.getOwnerAnalytics(range);
      if (res?.analytics) {
        setAnalytics(res.analytics);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Unable to load owner analytics from the salon server.');
      }
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRange]);

  // Initial load and range change
  useEffect(() => {
    fetchAnalytics({ silent: false, range: selectedRange });
  }, [fetchAnalytics, selectedRange]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    const socket = getSocket();

    const handleRealtimeEvent = () => {
      fetchAnalytics({ silent: true });
    };

    const events = [
      'queue:created',
      'queue:updated',
      'customer:called',
      'queue:called',
      'queue:started',
      'queue:completed',
      'queue:no-show',
      'queue:cancelled',
      'barber:updated',
      'barbers:updated',
      'salon:settings-updated',
    ];

    events.forEach((evt) => socket.on(evt, handleRealtimeEvent));
    socket.on('connect', handleRealtimeEvent);

    return () => {
      events.forEach((evt) => socket.off(evt, handleRealtimeEvent));
      socket.off('connect', handleRealtimeEvent);
    };
  }, [fetchAnalytics]);

  const tabs = [
    { id: 'stats', label: t('admin.tabStats'), icon: BarChart3 },
    { id: 'services', label: t('admin.tabServices'), icon: Sparkles },
    { id: 'barbers', label: t('admin.tabBarbers'), icon: Scissors },
    { id: 'settings', label: t('admin.tabSettings'), icon: Settings },
  ];

  const ranges = [
    { id: 'today', label: t('admin.rangeToday') },
    { id: '7d', label: t('admin.range7d') },
    { id: '30d', label: t('admin.range30d') },
    { id: 'all', label: t('admin.rangeAll') },
  ];

  const today = analytics?.todayOverview || {};
  const revenue = analytics?.revenueOverview || {};
  const queueStats = analytics?.queueAnalytics || {};
  const barberPerformance = analytics?.barberPerformance || [];
  const serviceStats = analytics?.serviceAnalytics?.services || [];
  const mostPopular = analytics?.serviceAnalytics?.mostPopularService;
  const recentActivity = analytics?.recentActivity || [];
  const dailyTrend = analytics?.dailyTrend || [];

  const maxSelectedCount = Math.max(1, ...(serviceStats.length ? serviceStats.map((s) => Number(s.selectedCount) || 0) : [1]));
  const maxTrendRegs = Math.max(1, ...(dailyTrend.length ? dailyTrend.map((d) => Number(d.totalRegistrations) || 0) : [1]));

  return (
    <StaffLayout subtitle={t('admin.title')} maxWidth="max-w-7xl">
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#C89B45] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Executive Management</span>
              </span>
              <Badge tone="gold" size="sm">Live Connected</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif mt-1">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-[#A8A096]">
              {t('admin.greetingSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Range Selector */}
            <div className="flex items-center rounded-xl border border-white/10 bg-[#292622]/80 p-1">
              {ranges.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRange(r.id)}
                  className={[
                    'px-3 py-1 text-xs font-semibold rounded-lg transition-colors',
                    selectedRange === r.id
                      ? 'bg-[#C89B45] text-[#191817] shadow-sm'
                      : 'text-[#A8A096] hover:text-white',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics({ silent: false })}
              disabled={refreshing || loading}
              leftIcon={RefreshCw}
              className={[
                'text-xs font-medium border-white/10 text-[#D9D0C2] hover:text-white hover:border-[#C89B45]',
                refreshing ? 'animate-spin' : '',
              ].join(' ')}
            >
              <span className="hidden sm:inline">{t('admin.refreshStats')}</span>
            </Button>
          </div>
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
                  'inline-flex items-center gap-2 min-h-[42px] px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap border transition-all',
                  selected
                    ? 'bg-[#C89B45] text-[#191817] border-[#C89B45] shadow-goldSubtle font-bold'
                    : 'bg-[#292622]/70 text-[#A8A096] border-white/5 hover:text-white hover:border-white/20',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading and Error States */}
        {loading && !analytics ? (
          <LoadingState message={t('common.loading')} />
        ) : error && !analytics ? (
          <ErrorState
            title="Failed to Load Analytics"
            description={error}
            onRetry={() => fetchAnalytics({ silent: false })}
          />
        ) : null}

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'stats' && analytics && (
          <div className="space-y-6">
            {/* Primary KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              {/* 1. Total Customers Today */}
              <Card elevated className="p-4 bg-[#292622]/90 border-white/5">
                <div className="flex items-center justify-between text-[#A8A096] mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{t('admin.kpiTotalCustomers')}</span>
                  <Users className="h-4 w-4 text-[#C89B45]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif tabular-nums">
                  {today.totalCustomersToday ?? 0}
                </div>
                <p className="text-[10px] text-[#A8A096] mt-1 truncate">
                  {t('admin.kpiUniqueCustomers', { count: today.totalAllTimeCustomers ?? 0 })}
                </p>
              </Card>

              {/* 2. Active Waiting Queue */}
              <Card elevated className={today.waitingCount > 0 ? 'p-4 bg-[#292622]/90 border-[#C89B45]/40 shadow-goldSubtle' : 'p-4 bg-[#292622]/90 border-white/5'}>
                <div className="flex items-center justify-between text-[#A8A096] mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{t('admin.kpiWaiting')}</span>
                  <Clock className="h-4 w-4 text-[#C89B45]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#C89B45] font-serif tabular-nums">
                  {today.waitingCount ?? 0}
                </div>
                <p className="text-[10px] text-[#A8A096] mt-1">
                  {today.calledCount > 0 ? `${today.calledCount} called to chair` : 'In waiting area'}
                </p>
              </Card>

              {/* 3. Currently Serving */}
              <Card elevated className="p-4 bg-[#292622]/90 border-white/5">
                <div className="flex items-center justify-between text-[#A8A096] mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{t('admin.kpiCurrentlyServing')}</span>
                  <Scissors className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-serif tabular-nums">
                  {today.servingCount ?? 0}
                </div>
                <p className="text-[10px] text-[#A8A096] mt-1">In stylist chair</p>
              </Card>

              {/* 4. Completed Services Today */}
              <Card elevated className="p-4 bg-[#292622]/90 border-white/5">
                <div className="flex items-center justify-between text-[#A8A096] mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{t('admin.kpiServicesDone')}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif tabular-nums">
                  {today.completedCount ?? 0}
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                  {queueStats.completionRate !== null ? `${queueStats.completionRate}% completion` : 'Finished'}
                </p>
              </Card>

              {/* 5. Estimated Revenue Today */}
              <Card elevated goldAccent className="p-4 bg-[#292622]/90">
                <div className="flex items-center justify-between text-[#A8A096] mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C89B45]">{t('admin.kpiRevenueToday')}</span>
                  <DollarSign className="h-4 w-4 text-[#C89B45]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#C89B45] font-serif tabular-nums">
                  {formatInr(revenue.todayRevenue ?? 0)}
                </div>
                <p className="text-[10px] text-[#A8A096] mt-1 truncate">
                  {t('admin.kpiWeeklyRevenue', { amount: formatInr(revenue.weeklyRevenue ?? 0) })}
                </p>
              </Card>

              {/* 6. Average Wait & Service Time */}
              <Card elevated className="p-4 bg-[#292622]/90 border-white/5">
                <div className="flex items-center justify-between text-[#A8A096] mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{t('admin.kpiAvgWait')}</span>
                  <TrendingUp className="h-4 w-4 text-[#C89B45]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif tabular-nums">
                  {queueStats.avgWaitMinutes !== null ? `~${queueStats.avgWaitMinutes}m` : '—'}
                </div>
                <p className="text-[10px] text-[#A8A096] mt-1 truncate">
                  {queueStats.avgServiceDurationMinutes !== null
                    ? `~${queueStats.avgServiceDurationMinutes}m avg duration`
                    : 'Duration tracking'}
                </p>
              </Card>
            </div>

            {/* Secondary KPI Bar: No-shows, Cancellations, All-time Revenue */}
            <div className="rounded-2xl border border-white/5 bg-[#292622]/60 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[#A8A096]">{t('admin.kpiNoShows')}:</span>
                  <span className="font-bold text-white tabular-nums">{today.noShowCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-[#A8A096]">{t('admin.kpiCancelled')}:</span>
                  <span className="font-bold text-white tabular-nums">{today.cancelledCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C89B45]" />
                  <span className="text-[#A8A096]">Monthly Revenue:</span>
                  <span className="font-bold text-[#C89B45] tabular-nums">
                    {formatInr(revenue.monthlyRevenue ?? 0)}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E8C982]" />
                  <span className="text-[#A8A096]">All-Time Completed Revenue:</span>
                  <span className="font-bold text-white tabular-nums">
                    {formatInr(revenue.totalCompletedRevenue ?? 0)}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-[#A8A096] italic">
                * {t('admin.estimatedRevenueDisclaimer')}
              </div>
            </div>

            {/* 2-Column Section: 7-Day Trend Chart & Service Popularity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: 7-Day Trend Chart */}
              <Card elevated className="p-5 sm:p-6 bg-[#292622]/90 border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#C89B45]" />
                        <span>{t('admin.trendTitle')}</span>
                      </h3>
                      <p className="text-xs text-[#A8A096]">Daily customer registrations & completed revenue</p>
                    </div>
                  </div>

                  {dailyTrend.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#A8A096]">
                      {t('admin.noDataAvailable')}
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-end justify-between gap-2 h-44 border-b border-white/10 pb-2">
                        {dailyTrend.map((item) => {
                          const heightPct = Math.max(12, Math.round((item.totalRegistrations / maxTrendRegs) * 100));
                          const formattedLabel = item.date.slice(5); // MM-DD
                          return (
                            <div key={item.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                              {/* Hover Tooltip */}
                              <div className="absolute -top-10 bg-black/90 text-white text-[10px] rounded px-2 py-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/10 shadow-lg">
                                {item.totalRegistrations} bookings • {formatInr(item.completedRevenue)}
                              </div>
                              <span className="text-[10px] font-bold text-white tabular-nums">
                                {item.totalRegistrations}
                              </span>
                              <div className="w-full max-w-[36px] bg-white/5 rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                                <div
                                  className="w-full bg-gradient-to-t from-[#C89B45] to-[#E8C982] rounded-t-md transition-all duration-500 group-hover:brightness-125"
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-[#A8A096] tabular-nums">{formattedLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#A8A096]">
                        <span>Showing last 7 business days</span>
                        <span className="text-[#C89B45] font-semibold">Gold bars: Customer Volume</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Right: Service Popularity & Revenue Distribution */}
              <Card elevated className="p-5 sm:p-6 bg-[#292622]/90 border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#C89B45]" />
                      <span>{t('admin.servicePopularityTitle')}</span>
                    </h3>
                    <p className="text-xs text-[#A8A096]">Ranked by total customer selections ({ranges.find((r) => r.id === selectedRange)?.label})</p>
                  </div>
                  {mostPopular && (
                    <Badge tone="gold" size="sm">
                      Top: {getLocalizedName(mostPopular.nameEn, mostPopular.nameGu)}
                    </Badge>
                  )}
                </div>

                {serviceStats.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#A8A096]">
                    {t('admin.noDataAvailable')}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {serviceStats.slice(0, 6).map((svc) => {
                      const pct = Math.max(8, Math.round((svc.selectedCount / maxSelectedCount) * 100));
                      return (
                        <div key={svc.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">
                              {getLocalizedName(svc.nameEn, svc.nameGu)}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-[#A8A096] tabular-nums">
                                {t('admin.serviceSelectedTimes', { count: svc.selectedCount })}
                              </span>
                              <span className="font-bold text-[#C89B45] tabular-nums">
                                {formatInr(svc.completedRevenueInr)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#C89B45] to-[#E8C982] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Barber Performance Matrix */}
            <Card elevated className="p-5 sm:p-6 bg-[#292622]/90 border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-[#C89B45]" />
                    <span>{t('admin.barberPerformanceTitle')}</span>
                  </h3>
                  <p className="text-xs text-[#A8A096]">Real-time chair workload, service status, and daily earnings</p>
                </div>
                <span className="text-xs text-[#A8A096]">
                  {barberPerformance.filter((b) => b.isOnDuty).length} Stylists On Duty
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {barberPerformance.map((barber) => (
                  <div
                    key={barber.barberId}
                    className="p-4 rounded-2xl border border-white/5 bg-black/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm text-[#191817]"
                          style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                        >
                          {getInitials(barber.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{barber.name}</p>
                          <p className="text-[11px] text-[#A8A096] truncate">{barber.specialty}</p>
                        </div>
                      </div>
                      <BarberAvailabilityBadge availability={barber.availability} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center">
                      <div>
                        <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Completed</span>
                        <span className="text-lg font-extrabold text-white tabular-nums">
                          {barber.customersCompletedToday}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">In Chair</span>
                        <span className="text-lg font-extrabold text-emerald-400 tabular-nums">
                          {barber.customersCurrentlyServing}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Waiting</span>
                        <span className="text-lg font-extrabold text-[#C89B45] tabular-nums">
                          {barber.customersWaiting}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-[#A8A096]">Completed Revenue:</span>
                      <span className="font-bold text-[#C89B45] tabular-nums">
                        {formatInr(barber.revenueTodayInr)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Live Queue Activity Feed */}
            <Card elevated className="p-5 sm:p-6 bg-[#292622]/90 border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                    <History className="h-4 w-4 text-[#C89B45]" />
                    <span>{t('admin.recentActivityTitle')}</span>
                  </h3>
                  <p className="text-xs text-[#A8A096]">Latest customer registrations and chair state changes today</p>
                </div>
                {lastUpdated && (
                  <span className="text-[11px] text-[#A8A096] tabular-nums">
                    Updated {formatTime12(lastUpdated.toISOString())}
                  </span>
                )}
              </div>

              {recentActivity.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#A8A096]">
                  {t('admin.noRecentActivity')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-[#A8A096]">
                        <th className="py-2.5 px-3">Token</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Services</th>
                        <th className="py-2.5 px-3">Stylist</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentActivity.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 font-bold text-white tabular-nums text-sm">
                            {item.tokenNumber}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-white block">{item.customerName}</span>
                            <span className="text-[10px] text-[#A8A096] tabular-nums">{maskPhone(item.phone)}</span>
                          </td>
                          <td className="py-3 px-3">
                            <QueueStatusBadge status={item.status} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-[#D9D0C2] max-w-xs truncate">
                            {item.services.map((s) => getLocalizedName(s.nameEn, s.nameGu)).join(', ') || 'Service'}
                          </td>
                          <td className="py-3 px-3 text-[#A8A096]">
                            {item.assignedBarberName || 'Unassigned'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border border-white/10 bg-white/5 text-[#D9D0C2]">
                              {item.source}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-[#C89B45] tabular-nums">
                            {formatInr(item.totalPriceInr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 2: SERVICES CATALOG */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">{t('admin.tabServices')}</h3>
                <p className="text-xs text-[#A8A096]">Configured salon grooming menu and pricing catalog</p>
              </div>
              <Badge tone="gold">
                {t('common.activeServicesCount', { count: bootstrap?.counts?.activeServices ?? 0 })}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(bootstrap?.services || []).map((svc) => (
                <Card key={svc.id} elevated className="p-4 bg-[#292622]/90 border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {getLocalizedName(svc.nameEn, svc.nameGu)}
                    </span>
                    <span className="text-sm font-extrabold text-[#C89B45] tabular-nums">
                      {formatInr(svc.priceInr)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#A8A096]">
                    <span>~{svc.durationMinutes} mins service</span>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">Active</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BARBERS ROSTER */}
        {activeTab === 'barbers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">{t('admin.tabBarbers')}</h3>
                <p className="text-xs text-[#A8A096]">Master barber team, active chairs, and duty status</p>
              </div>
              <Badge tone="gold">
                {t('common.onDutyBarbersCount', { count: bootstrap?.counts?.onDutyBarbers ?? 0 })}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(bootstrap?.barbers || []).map((barber) => (
                <Card key={barber.id} elevated className="p-5 bg-[#292622]/90 border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-[#191817] shrink-0"
                        style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                      >
                        {getInitials(barber.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{barber.name}</p>
                        <p className="text-xs text-[#A8A096] truncate">{barber.specialty}</p>
                      </div>
                    </div>
                    <BarberAvailabilityBadge availability={barber.availability} />
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#A8A096]">
                    <span>Chair #{barber.id}</span>
                    <span className="font-semibold text-[#D9D0C2]">Duty: {barber.isOnDuty ? 'On Duty' : 'Off Duty'}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QUEUE SETTINGS & OPERATING HOURS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white font-serif">{t('admin.tabSettings')}</h3>
              <p className="text-xs text-[#A8A096]">Operating hours, online cutoff policies, and grace period settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card elevated className="p-5 bg-[#292622]/90 border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Clock className="h-4 w-4 text-[#C89B45]" />
                  <span>Salon Business Hours</span>
                </div>
                <p className="text-xs text-[#A8A096]">
                  {bootstrap?.salon
                    ? t('admin.hoursSummary', {
                        open: formatTime24To12(bootstrap.salon.openTime),
                        close: formatTime24To12(bootstrap.salon.closeTime),
                      })
                    : ''}
                </p>
                <div className="pt-2 border-t border-white/5 text-xs text-[#D9D0C2] space-y-1">
                  <p>• Online remote queue automatically closes 30 minutes before salon close.</p>
                  <p>• Reception walk-in registration stays open until salon closing.</p>
                </div>
              </Card>

              <Card elevated className="p-5 bg-[#292622]/90 border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <AlertCircle className="h-4 w-4 text-[#C89B45]" />
                  <span>Queue Policies</span>
                </div>
                <div className="text-xs text-[#D9D0C2] space-y-2">
                  <p>• <strong>No-Show Grace Period:</strong> 10 minutes strictly enforced after customer is called.</p>
                  <p>• <strong>Service Limit:</strong> Maximum 3 services per customer booking.</p>
                  <p>• <strong>Timezone:</strong> Asia/Kolkata (IST).</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
