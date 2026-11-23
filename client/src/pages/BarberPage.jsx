import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coffee,
  Play,
  RotateCcw,
  Scissors,
  Sparkles,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatInr, getInitials } from '../utils/formatters.js';

export function BarberPage() {
  const { name } = useParams();
  const { user } = useAuth();
  const { bootstrap, refreshBootstrap } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  const [barberQueue, setBarberQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isTogglingBreak, setIsTogglingBreak] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Live timer for elapsed chair service
  const [nowSec, setNowSec] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowSec(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBarberParam = String(name || (user?.role === 'barber' ? user.slug : null) || 'isha').trim().toLowerCase();

  const fetchBarberData = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeBarberParam) return;
      if (!silent) setLoading(true);
      try {
        const res = await api.getBarberQueue(activeBarberParam);
        if (res?.barber) {
          setBarberQueue(res);
          setError(null);
        } else {
          setError('BARBER_NOT_FOUND');
        }
      } catch (err) {
        setError(err.message || 'Failed to load barber chair.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activeBarberParam]
  );

  useEffect(() => {
    fetchBarberData();
  }, [fetchBarberData]);

  // Socket.IO sync
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      fetchBarberData({ silent: true });
      refreshBootstrap({ silent: true });
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('queue:called', handleUpdate);
    socket.on('customer:called', handleUpdate);
    socket.on('queue:started', handleUpdate);
    socket.on('queue:completed', handleUpdate);
    socket.on('queue:no-show', handleUpdate);
    socket.on('queue:cancelled', handleUpdate);
    socket.on('barber:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    socket.on('connect', handleUpdate);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBarberData({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:called', handleUpdate);
      socket.off('customer:called', handleUpdate);
      socket.off('queue:started', handleUpdate);
      socket.off('queue:completed', handleUpdate);
      socket.off('queue:no-show', handleUpdate);
      socket.off('queue:cancelled', handleUpdate);
      socket.off('barber:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
      socket.off('connect', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchBarberData, refreshBootstrap]);

  const barbers = bootstrap?.barbers || [];
  const barber = barberQueue?.barber;
  const currentCustomer = barberQueue?.currentCustomer;
  const upcomingQueue = barberQueue?.upcomingQueue || [];

  // Start service handler (CALLED -> IN_CHAIR)
  const handleStart = async () => {
    if (!currentCustomer || !barber) return;
    setIsStarting(true);
    setActionNotice(null);
    try {
      await api.startService(currentCustomer.id, barber.id);
      fetchBarberData({ silent: true });
    } catch (err) {
      setActionNotice(err.message || 'Failed to start service.');
    } finally {
      setIsStarting(false);
    }
  };

  // Complete service handler (IN_CHAIR -> DONE)
  const handleComplete = async () => {
    if (!currentCustomer || !barber) return;
    setIsCompleting(true);
    setActionNotice(null);
    try {
      await api.completeService(currentCustomer.id, barber.id);
      fetchBarberData({ silent: true });
    } catch (err) {
      setActionNotice(err.message || 'Failed to complete service.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Toggle Break handler
  const handleToggleBreak = async () => {
    if (!barber) return;
    if (currentCustomer) {
      setActionNotice(t('barber.breakBlocked'));
      return;
    }
    setIsTogglingBreak(true);
    setActionNotice(null);
    try {
      const nextAvailability = barber.availability === 'ON_BREAK' ? 'AVAILABLE' : 'ON_BREAK';
      await api.updateBarberAvailability(barber.id, nextAvailability);
      fetchBarberData({ silent: true });
    } catch (err) {
      setActionNotice(err.message || 'Failed to update break state.');
    } finally {
      setIsTogglingBreak(false);
    }
  };

  // Calculate elapsed time for chair
  let elapsedMinutes = 0;
  let elapsedSeconds = 0;
  if (currentCustomer?.serviceStartedAt) {
    const elapsedMs = Math.max(
      0,
      nowSec - new Date(currentCustomer.serviceStartedAt).getTime()
    );
    const totalSec = Math.floor(elapsedMs / 1000);
    elapsedMinutes = Math.floor(totalSec / 60);
    elapsedSeconds = totalSec % 60;
  }

  return (
    <StaffLayout subtitle={t('barber.title')} maxWidth="max-w-3xl">
      {loading && !barberQueue ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !barberQueue ? (
        <ErrorState onRetry={() => fetchBarberData()} />
      ) : (
        <div className="space-y-5 max-w-xl mx-auto">
          {/* Barber Switcher */}
          <Card elevated>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t('barber.switchBarber')}</CardTitle>
                <Badge tone="gold">{t('barber.liveChairBadge')}</Badge>
              </div>
              <CardDescription>{t('barber.chooseBarberSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pt-0">
              {barbers.map((b) => {
                const isSelected = barber?.id === b.id;
                return (
                  <Link
                    key={b.id}
                    to={`/barber/${b.slug}`}
                    className={[
                      'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border text-sm font-semibold transition-colors',
                      isSelected
                        ? 'bg-salon-gold text-salon-deep border-salon-gold font-bold shadow-sm'
                        : 'bg-salon-card text-salon-textSecondary border-salon-border hover:text-white hover:border-salon-gold/40',
                    ].join(' ')}
                  >
                    <Scissors className="h-4 w-4" />
                    <span>{b.name}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Notice Alert */}
          {actionNotice && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center justify-between text-xs sm:text-sm text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{actionNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-amber-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {barber ? (
            <>
              {/* Active Barber Identity Card + Break Toggle */}
              <Card elevated goldAccent>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-base font-extrabold text-salon-deep shrink-0"
                        style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                      >
                        {getInitials(barber.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-salon-textMuted">
                          {t('barber.activeBarberLabel')}
                        </p>
                        <h1 className="text-2xl font-extrabold text-white truncate font-serif">
                          {barber.name}
                        </h1>
                        <p className="text-xs text-salon-textSecondary truncate">
                          {barber.specialty}
                        </p>
                      </div>
                    </div>
                    <BarberAvailabilityBadge availability={barber.availability} size="lg" />
                  </div>

                  {/* On Break Toggle */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-salon-textMuted">
                      {barber.availability === 'ON_BREAK'
                        ? 'Currently on break'
                        : 'Chair active on floor'}
                    </span>
                    <Button
                      variant={barber.availability === 'ON_BREAK' ? 'primary' : 'outline'}
                      size="sm"
                      leftIcon={Coffee}
                      onClick={handleToggleBreak}
                      disabled={Boolean(currentCustomer) || isTogglingBreak}
                      loading={isTogglingBreak}
                    >
                      {barber.availability === 'ON_BREAK'
                        ? t('barber.returnFromBreak')
                        : t('barber.toggleBreak')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Chair Panel */}
              <Card elevated className="border-salon-gold/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-salon-gold" />
                      <span>{t('barber.currentCustomerTitle')}</span>
                    </span>
                    {currentCustomer && (
                      <QueueStatusBadge status={currentCustomer.status} size="sm" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentCustomer ? (
                    <div className="space-y-4">
                      {/* Customer Details Strip */}
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-black text-salon-gold tabular-nums tracking-tight">
                            {currentCustomer.tokenNumber}
                          </span>
                          <span className="text-xs text-salon-textMuted">
                            ~{currentCustomer.totalDurationMinutes} mins
                          </span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {currentCustomer.customerName}
                        </p>
                        <div className="text-xs text-salon-textSecondary">
                          {currentCustomer.services
                            .map((s) => getLocalizedName(s.nameEn, s.nameGu))
                            .join(', ')}
                        </div>

                        {/* Live Timer if IN_CHAIR */}
                        {currentCustomer.status === 'IN_CHAIR' && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-salon-textMuted flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-salon-gold" />
                              <span>{t('barber.elapsedServiceTime')}</span>
                            </span>
                            <span className="font-mono text-sm font-bold text-salon-gold tabular-nums">
                              {String(elapsedMinutes).padStart(2, '0')}:
                              {String(elapsedSeconds).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Primary Large 56px Action Buttons */}
                      {currentCustomer.status === 'CALLED' ? (
                        <Button
                          variant="primary"
                          fullWidth
                          size="lg"
                          leftIcon={Play}
                          loading={isStarting}
                          disabled={isStarting}
                          onClick={handleStart}
                          className="h-14 text-base font-extrabold shadow-goldGlow"
                        >
                          {isStarting ? t('barber.starting') : t('barber.btnStart')}
                        </Button>
                      ) : currentCustomer.status === 'IN_CHAIR' ? (
                        <Button
                          variant="primary"
                          fullWidth
                          size="lg"
                          leftIcon={CheckCircle2}
                          loading={isCompleting}
                          disabled={isCompleting}
                          onClick={handleComplete}
                          className="h-14 text-base font-extrabold shadow-goldGlow bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                        >
                          {isCompleting ? t('barber.completing') : t('barber.btnDone')}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <EmptyState
                      icon={User}
                      title={t('barber.emptyChairTitle')}
                      description={t('barber.noCurrentCustomer')}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Next Assigned Customers Preview */}
              <Card elevated>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-salon-gold" />
                      <span>{t('barber.upcomingForYou')}</span>
                    </span>
                    <Badge tone="neutral">{upcomingQueue.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingQueue.length === 0 ? (
                    <p className="text-xs text-salon-textMuted text-center py-4">
                      {t('barber.noUpcomingCustomers')}
                    </p>
                  ) : (
                    <div className="space-y-2 divide-y divide-white/5">
                      {upcomingQueue.map((item, idx) => (
                        <div
                          key={item.id}
                          className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-[11px] font-bold text-salon-gold tabular-nums">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {item.tokenNumber}
                                </span>
                                <span className="text-salon-textSecondary">
                                  {item.customerName}
                                </span>
                              </div>
                              <p className="text-[11px] text-salon-textMuted">
                                {item.services
                                  .map((s) => getLocalizedName(s.nameEn, s.nameGu))
                                  .join(', ')}
                              </p>
                            </div>
                          </div>
                          <Badge tone={item.isSpecific ? 'gold' : 'neutral'} size="sm">
                            {item.isSpecific ? 'Direct' : 'Any'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </StaffLayout>
  );
}
