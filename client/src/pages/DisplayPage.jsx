import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Scissors, Sparkles } from 'lucide-react';
import { DisplayLayout } from '../layouts/DisplayLayout.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { getInitials } from '../utils/formatters.js';

export function DisplayPage() {
  const { refreshBootstrap, socketStatus } = useConnection();
  const { t, language } = useLanguage();

  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [justCalledId, setJustCalledId] = useState(null);
  const flashTimeoutRef = useRef(null);

  const fetchDisplay = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getDisplayQueue();
      setDisplayData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load display.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisplay();
  }, [fetchDisplay]);

  // Fallback periodic refresh for TV display when socket is offline / serverless
  useEffect(() => {
    if (socketStatus === 'live') return;
    const interval = setInterval(() => {
      fetchDisplay({ silent: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [socketStatus, fetchDisplay]);

  // Socket.IO sync
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      fetchDisplay({ silent: true });
      refreshBootstrap({ silent: true });
    };

    const handleCustomerCalled = (payload) => {
      if (payload?.entryId) {
        setJustCalledId(payload.entryId);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setJustCalledId(null), 10000); // 10s flash
      }
      fetchDisplay({ silent: true });
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('queue:called', handleUpdate);
    socket.on('customer:called', handleCustomerCalled);
    socket.on('queue:started', handleUpdate);
    socket.on('queue:completed', handleUpdate);
    socket.on('queue:no-show', handleUpdate);
    socket.on('queue:cancelled', handleUpdate);
    socket.on('barber:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    socket.on('connect', handleUpdate);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDisplay({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:called', handleUpdate);
      socket.off('customer:called', handleCustomerCalled);
      socket.off('queue:started', handleUpdate);
      socket.off('queue:completed', handleUpdate);
      socket.off('queue:no-show', handleUpdate);
      socket.off('queue:cancelled', handleUpdate);
      socket.off('barber:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
      socket.off('connect', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [fetchDisplay, refreshBootstrap]);

  const chairs = displayData?.chairs || [];
  const upcomingTokens = displayData?.upcomingTokens || [];

  return (
    <DisplayLayout>
      {loading && !displayData ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message={t('common.loading')} className="w-full max-w-md" />
        </div>
      ) : error && !displayData ? (
        <div className="flex-1 flex items-center justify-center">
          <ErrorState onRetry={() => fetchDisplay()} className="w-full max-w-md" />
        </div>
      ) : (
        <>
          {/* Active Barber Chairs — 5m Readability */}
          <section
            aria-label={t('display.nowServingTitle')}
            className="flex-1 min-h-0 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg lg:text-2xl font-extrabold uppercase tracking-wider text-salon-gold flex items-center gap-2.5 font-serif">
                <Scissors className="h-6 w-6" />
                <span>{t('display.nowServingTitle')}</span>
              </h1>
              <Badge tone="emerald" size="lg" dot>
                {t('display.liveDisplayBadge')}
              </Badge>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {chairs.map((chair) => {
                const cust = chair.currentCustomer;
                const isCalled = cust?.status === 'CALLED';
                const isFlash = cust && cust.entryId === justCalledId;

                return (
                  <Card
                    key={chair.barberId}
                    className={[
                      'bg-salon-bg border-2 flex flex-col justify-between p-6 lg:p-8 transition-all',
                      isCalled || isFlash
                        ? 'border-salon-gold shadow-goldGlow animate-softPulse'
                        : 'border-salon-border',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full text-lg lg:text-2xl font-extrabold text-salon-deep shrink-0"
                          style={{ backgroundColor: chair.avatarColor || '#D4A017' }}
                        >
                          {getInitials(chair.barberName)}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-2xl lg:text-3xl font-extrabold text-white truncate font-serif">
                            {chair.barberName}
                          </h2>
                          <p className="text-xs text-salon-textMuted uppercase tracking-wider">
                            {chair.availability}
                          </p>
                        </div>
                      </div>
                      <BarberAvailabilityBadge availability={chair.availability} size="lg" />
                    </div>

                    {/* Primary Token Display */}
                    <div className="my-6 text-center space-y-2">
                      {cust ? (
                        <>
                          <div className="text-xs font-bold uppercase tracking-widest text-salon-gold">
                            {cust.status === 'CALLED' ? 'NOW CALLING' : 'IN CHAIR'}
                          </div>
                          <div className="text-6xl lg:text-8xl font-black tracking-tight text-salon-gold tabular-nums leading-none drop-shadow-lg">
                            {cust.tokenNumber}
                          </div>
                          <p className="text-lg lg:text-2xl font-bold text-white truncate">
                            {cust.customerName}
                          </p>
                          <p className="text-xs lg:text-sm text-salon-textMuted truncate">
                            {language === 'gu' && cust.serviceNameGu
                              ? cust.serviceNameGu
                              : cust.serviceNameEn}
                          </p>
                        </>
                      ) : (
                        <div className="py-4">
                          <div className="text-4xl lg:text-6xl font-black tracking-tight text-salon-gold/60 tabular-nums">
                            {chair.availability === 'ON_BREAK'
                              ? t('display.onBreakLabel')
                              : t('display.readyLabel')}
                          </div>
                          <p className="text-xs text-salon-textMuted mt-2">
                            {chair.availability === 'ON_BREAK'
                              ? 'Stylist will return shortly'
                              : 'Ready for next client'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-salon-border/80 flex items-center justify-between text-sm lg:text-base text-salon-textSecondary">
                      <span>{t('brand.defaultName')}</span>
                      <span className="font-semibold text-salon-textMuted tabular-nums">
                        {cust ? cust.tokenNumber : '—'}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Upcoming Queue Strip (~26% height on 1080p) */}
          <section
            aria-label={t('display.upcomingTitle')}
            className="shrink-0 rounded-2xl border border-salon-border bg-salon-bg/95 p-5 lg:p-6 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-salon-gold" />
                <h2 className="text-lg lg:text-xl font-extrabold uppercase tracking-wider text-white font-serif">
                  {t('display.upcomingTitle')}
                </h2>
                <span className="text-xs lg:text-sm text-salon-textMuted">
                  — {t('display.upcomingSubtitle')}
                </span>
              </div>
              <Badge tone="gold" size="lg">
                {upcomingTokens.length} in queue
              </Badge>
            </div>

            {upcomingTokens.length === 0 ? (
              <p className="text-xs lg:text-sm text-salon-textMuted py-4 text-center">
                {t('display.emptyUpcoming')}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {upcomingTokens.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/5 bg-black/40 p-3.5 text-center space-y-1"
                  >
                    <div className="text-xs font-semibold text-salon-textMuted">#{idx + 1}</div>
                    <div className="text-2xl lg:text-3xl font-black text-salon-gold tabular-nums">
                      {item.tokenNumber}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">
                      {item.customerName}
                    </div>
                    <div className="text-[10px] text-salon-textMuted truncate">
                      {item.preferredBarberName || 'Any Barber'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DisplayLayout>
  );
}
