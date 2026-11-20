import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Sparkles,
  Ticket,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge, BarberAvailabilityBadge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatInr, formatTime12, getInitials, maskPhone } from '../utils/formatters.js';

export function ReceptionPage() {
  const { bootstrap, refreshBootstrap } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState([]);
  const [walkInBarberId, setWalkInBarberId] = useState(null);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState(null);
  const [walkInSuccess, setWalkInSuccess] = useState(null);

  // Action modals (Call Next, No-show, Cancel)
  const [callingBarberId, setCallingBarberId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const [noShowTarget, setNoShowTarget] = useState(null);
  const [noShowSubmitting, setNoShowSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Clock tick for live timers (seconds)
  const [nowSec, setNowSec] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowSec(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getQueue();
      setQueueData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch queue.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Socket.IO event listener
  useEffect(() => {
    const socket = getSocket();

    const handleQueueChange = () => {
      fetchQueue({ silent: true });
      refreshBootstrap({ silent: true });
    };

    socket.on('queue:created', handleQueueChange);
    socket.on('queue:updated', handleQueueChange);
    socket.on('queue:called', handleQueueChange);
    socket.on('queue:started', handleQueueChange);
    socket.on('queue:completed', handleQueueChange);
    socket.on('queue:no-show', handleQueueChange);
    socket.on('queue:cancelled', handleQueueChange);
    socket.on('barber:updated', handleQueueChange);
    socket.on('barbers:updated', handleQueueChange);
    socket.on('connect', handleQueueChange);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchQueue({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('queue:created', handleQueueChange);
      socket.off('queue:updated', handleQueueChange);
      socket.off('queue:called', handleQueueChange);
      socket.off('queue:started', handleQueueChange);
      socket.off('queue:completed', handleQueueChange);
      socket.off('queue:no-show', handleQueueChange);
      socket.off('queue:cancelled', handleQueueChange);
      socket.off('barber:updated', handleQueueChange);
      socket.off('barbers:updated', handleQueueChange);
      socket.off('connect', handleQueueChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchQueue, refreshBootstrap]);

  const barbers = queueData?.barbers || bootstrap?.barbers || [];
  const entries = queueData?.entries || [];

  // Group active customers by assigned barber
  const activeCustomerByBarber = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if ((e.status === 'CALLED' || e.status === 'IN_CHAIR') && e.assignedBarber?.id) {
        map[e.assignedBarber.id] = e;
      }
    }
    return map;
  }, [entries]);

  // Filter waiting entries by search query
  const filteredWaitingEntries = useMemo(() => {
    const waiting = entries.filter((e) => e.status === 'WAITING');
    if (!searchQuery.trim()) return waiting;
    const q = searchQuery.toLowerCase().trim();
    return waiting.filter(
      (e) =>
        e.tokenNumber.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q) ||
        (e.phone && e.phone.includes(q))
    );
  }, [entries, searchQuery]);

  // Call Next handler
  const handleCallNext = async (barberId) => {
    setCallingBarberId(barberId);
    setActionNotice(null);
    try {
      await api.callNext(barberId);
      fetchQueue({ silent: true });
    } catch (err) {
      setActionNotice(err.message || t('reception.noEligibleCustomers'));
    } finally {
      setCallingBarberId(null);
    }
  };

  // No-show handler
  const handleConfirmNoShow = async () => {
    if (!noShowTarget) return;
    setNoShowSubmitting(true);
    try {
      await api.markNoShow(noShowTarget.id);
      setNoShowTarget(null);
      fetchQueue({ silent: true });
    } catch (err) {
      setActionNotice(err.message || 'Failed to mark No-Show');
    } finally {
      setNoShowSubmitting(false);
    }
  };

  // Cancel handler
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelSubmitting(true);
    try {
      await api.cancelQueueEntry(cancelTarget.id, 'RECEPTION_CANCELLED');
      setCancelTarget(null);
      fetchQueue({ silent: true });
    } catch (err) {
      setActionNotice(err.message || 'Failed to cancel ticket');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Walk-in submit handler
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError(null);
    setWalkInSuccess(null);

    const cleanPhone = walkInPhone.replace(/\D/g, '');
    if (!walkInName.trim() || walkInName.trim().length < 2) {
      setWalkInError(t('join.errNameRequired'));
      setWalkInSubmitting(false);
      return;
    }
    if (cleanPhone.length !== 10) {
      setWalkInError(t('join.errPhoneInvalid'));
      setWalkInSubmitting(false);
      return;
    }
    if (walkInServices.length === 0 || walkInServices.length > 3) {
      setWalkInError(t('join.errServiceRequired'));
      setWalkInSubmitting(false);
      return;
    }

    try {
      const res = await api.addWalkIn({
        customerName: walkInName.trim(),
        phone: cleanPhone,
        serviceIds: walkInServices,
        preferredBarberId: walkInBarberId === 'any' ? null : walkInBarberId,
      });

      if (res?.entry) {
        setWalkInSuccess(res.entry);
        setWalkInName('');
        setWalkInPhone('');
        setWalkInServices([]);
        setWalkInBarberId(null);
        fetchQueue({ silent: true });
      }
    } catch (err) {
      setWalkInError(err.message || 'Failed to register walk-in');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const services = bootstrap?.services || [];

  return (
    <StaffLayout subtitle={t('reception.title')} maxWidth="max-w-7xl">
      {loading && !queueData ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !queueData ? (
        <ErrorState onRetry={() => fetchQueue()} />
      ) : (
        <div className="space-y-5">
          {/* Action Notice Toast */}
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
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Operational Header Strip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white font-serif">
                  {t('reception.title')}
                </h1>
                <Badge tone="emerald" dot>
                  {t('reception.liveQueueBadge')}
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-salon-textMuted">
                {t('reception.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                leftIcon={Plus}
                onClick={() => {
                  setWalkInSuccess(null);
                  setWalkInError(null);
                  setShowWalkInModal(true);
                }}
                className="font-bold shadow-goldGlow"
              >
                {t('reception.addWalkIn')}
              </Button>

              <div className="w-full sm:w-64">
                <Input
                  id="reception-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('reception.searchPlaceholder')}
                  rightSlot={<Search className="h-4 w-4 text-salon-textMuted" />}
                />
              </div>
            </div>
          </div>

          {/* Tablet Landscape Split (10-inch optimized: 5 cols left / 7 cols right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANEL: Barber Chairs & Call Next Controls */}
            <section
              className="lg:col-span-5 space-y-3"
              aria-label={t('reception.barbersPanelTitle')}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-salon-gold" />
                  <span>{t('reception.barbersPanelTitle')}</span>
                </h2>
                <Badge tone="neutral">
                  {t('common.onDutyBarbersCount', {
                    count: barbers.filter((b) => b.isOnDuty).length,
                  })}
                </Badge>
              </div>

              <div className="space-y-3">
                {barbers.map((barber) => {
                  const activeCust = activeCustomerByBarber[barber.id];
                  const isAvailable =
                    barber.availability === 'AVAILABLE' && !activeCust && barber.isOnDuty;
                  const isCallingThis = callingBarberId === barber.id;

                  // Elapsed & No-show calculation if CALLED
                  let noShowRemainingSec = 0;
                  let isNoShowEligible = false;
                  if (activeCust?.status === 'CALLED' && activeCust?.calledAt) {
                    const elapsedMs = Math.max(0, nowSec - new Date(activeCust.calledAt).getTime());
                    const graceMs = (activeCust.noShowGraceSeconds || 600) * 1000;
                    noShowRemainingSec = Math.max(0, Math.ceil((graceMs - elapsedMs) / 1000));
                    isNoShowEligible = noShowRemainingSec === 0;
                  }

                  return (
                    <Card key={barber.id} elevated className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-salon-deep shrink-0"
                              style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                            >
                              {getInitials(barber.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{barber.name}</p>
                              <p className="text-xs text-salon-textMuted truncate">
                                {barber.specialty}
                              </p>
                            </div>
                          </div>
                          <BarberAvailabilityBadge availability={barber.availability} />
                        </div>

                        {/* Active Customer in Chair */}
                        {activeCust ? (
                          <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-salon-gold">
                                {activeCust.tokenNumber}
                              </span>
                              <QueueStatusBadge status={activeCust.status} size="sm" />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">
                                {activeCust.customerName}
                              </span>
                              <span className="text-salon-textMuted">
                                {activeCust.services.map((s) => s.nameEn).join(', ')}
                              </span>
                            </div>

                            {/* No-show timer strip if CALLED */}
                            {activeCust.status === 'CALLED' && (
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-salon-textMuted tabular-nums">
                                  {isNoShowEligible
                                    ? t('reception.noShow')
                                    : t('reception.noShowCountdown', {
                                        time: `${Math.floor(noShowRemainingSec / 60)}:${String(
                                          noShowRemainingSec % 60
                                        ).padStart(2, '0')}`,
                                      })}
                                </span>
                                <Button
                                  variant={isNoShowEligible ? 'danger' : 'outline'}
                                  size="sm"
                                  disabled={!isNoShowEligible}
                                  onClick={() => setNoShowTarget(activeCust)}
                                  className="text-xs py-1 px-2.5 h-7"
                                >
                                  {t('reception.noShow')}
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Call Next Button */}
                        <div className="pt-1">
                          <Button
                            variant="secondary"
                            fullWidth
                            size="md"
                            disabled={!isAvailable || isCallingThis}
                            loading={isCallingThis}
                            onClick={() => handleCallNext(barber.id)}
                            leftIcon={Scissors}
                            className="font-bold"
                          >
                            {isCallingThis
                              ? t('reception.callingNext')
                              : `${t('reception.callNext')} (${barber.name})`}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* RIGHT PANEL: Waiting Queue Table */}
            <section
              className="lg:col-span-7 space-y-3"
              aria-label={t('reception.queuePanelTitle')}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-salon-gold" />
                  <span>{t('reception.queuePanelTitle')}</span>
                </h2>
                <Badge tone="gold">
                  {filteredWaitingEntries.length} {t('myStatus.stepWaiting')}
                </Badge>
              </div>

              <Card elevated className="overflow-hidden">
                {filteredWaitingEntries.length === 0 ? (
                  <CardContent className="p-8">
                    <EmptyState
                      compact
                      icon={Users}
                      title={t('reception.emptyQueueTitle')}
                      description={t('reception.emptyQueueDescription')}
                    />
                  </CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-black/40 text-salon-textMuted font-semibold uppercase tracking-wider">
                          <th className="py-3 px-3">{t('reception.token')}</th>
                          <th className="py-3 px-3">{t('reception.customer')}</th>
                          <th className="py-3 px-3">{t('reception.services')}</th>
                          <th className="py-3 px-3">{t('reception.barber')}</th>
                          <th className="py-3 px-3">{t('reception.waitTime')}</th>
                          <th className="py-3 px-3 text-right">{t('reception.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredWaitingEntries.map((row) => {
                          const waitMins = Number(row.approxWaitMinutes || 0);
                          const isOver60m = waitMins > 60;

                          return (
                            <tr
                              key={row.id}
                              className={[
                                'hover:bg-white/[0.02] transition-colors',
                                isOver60m ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : '',
                              ].join(' ')}
                            >
                              {/* Token */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="font-extrabold text-sm text-salon-gold tabular-nums">
                                  {row.tokenNumber}
                                </span>
                                <span className="block text-[10px] text-salon-textMuted">
                                  {row.source === 'WALK_IN' ? 'Walk-in' : 'Online'}
                                </span>
                              </td>

                              {/* Customer */}
                              <td className="py-3 px-3">
                                <span className="font-semibold text-white block">
                                  {row.customerName}
                                </span>
                                <span className="text-[11px] text-salon-textMuted tabular-nums">
                                  {maskPhone(row.phone)}
                                </span>
                              </td>

                              {/* Services */}
                              <td className="py-3 px-3 max-w-[150px] truncate">
                                <span className="text-salon-textSecondary">
                                  {row.services
                                    .map((s) => getLocalizedName(s.nameEn, s.nameGu))
                                    .join(', ')}
                                </span>
                                <span className="block text-[10px] text-salon-textMuted">
                                  {row.totalDurationMinutes}m • {formatInr(row.totalPriceInr)}
                                </span>
                              </td>

                              {/* Preferred Barber */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="text-white font-medium">
                                  {row.preferredBarber ? row.preferredBarber.name : t('join.anyBarberTitle')}
                                </span>
                              </td>

                              {/* Wait Time */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="font-bold text-salon-gold tabular-nums">
                                  ~{row.approxWaitMinutes}m
                                </span>
                                {isOver60m && (
                                  <span className="block text-[10px] text-amber-400 font-bold">
                                    {t('reception.waitWarning60m')}
                                  </span>
                                )}
                              </td>

                              {/* Cancel Action */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setCancelTarget(row)}
                                  className="text-salon-textMuted hover:text-red-400 p-1 rounded-lg transition-colors"
                                  title={t('reception.confirmCancel')}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </section>
          </div>

          {/* WALK-IN MODAL */}
          {showWalkInModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#1E1E1E] p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-white font-serif">
                      {t('reception.walkInModalTitle')}
                    </h3>
                    <p className="text-xs text-salon-textMuted">
                      {t('reception.walkInModalSubtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="text-salon-textMuted hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {walkInSuccess ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {t('reception.walkInSuccess', { token: walkInSuccess.tokenNumber })}
                      </h4>
                      <p className="text-xs text-salon-textMuted mt-1">
                        {walkInSuccess.customerName} (~{walkInSuccess.approxWaitMinutes} mins)
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setWalkInSuccess(null);
                        }}
                      >
                        Add Another Walk-in
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWalkInModal(false)}
                      >
                        {t('reception.dismiss')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleWalkInSubmit} className="space-y-4">
                    {walkInError && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                        {walkInError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-salon-textMuted mb-1">
                          {t('join.nameLabel')}
                        </label>
                        <Input
                          value={walkInName}
                          onChange={(e) => setWalkInName(e.target.value)}
                          placeholder="e.g. Kunal Shah"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-salon-textMuted mb-1">
                          {t('join.phoneLabel')}
                        </label>
                        <Input
                          value={walkInPhone}
                          onChange={(e) => setWalkInPhone(e.target.value)}
                          placeholder="10-digit mobile"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    {/* Services (up to 3) */}
                    <div>
                      <label className="block text-xs font-semibold text-salon-textMuted mb-1.5">
                        {t('join.stepServices')} (max 3)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                        {services.map((svc) => {
                          const isSel = walkInServices.includes(svc.id);
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => {
                                setWalkInServices((prev) =>
                                  prev.includes(svc.id)
                                    ? prev.filter((id) => id !== svc.id)
                                    : prev.length < 3
                                    ? [...prev, svc.id]
                                    : prev
                                );
                              }}
                              className={[
                                'p-2.5 rounded-xl border text-left text-xs transition-colors',
                                isSel
                                  ? 'border-salon-gold bg-salon-gold/15 text-white font-semibold'
                                  : 'border-white/5 bg-black/30 text-salon-textSecondary hover:border-white/20',
                              ].join(' ')}
                            >
                              <div className="truncate">
                                {getLocalizedName(svc.nameEn, svc.nameGu)}
                              </div>
                              <div className="text-[10px] text-salon-textMuted tabular-nums">
                                {svc.durationMinutes}m • {formatInr(svc.priceInr)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Barber selection */}
                    <div>
                      <label className="block text-xs font-semibold text-salon-textMuted mb-1">
                        {t('join.stepBarber')}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setWalkInBarberId(null)}
                          className={[
                            'p-2 rounded-xl border text-xs text-center transition-colors truncate',
                            walkInBarberId === null
                              ? 'border-salon-gold bg-salon-gold/15 text-white font-bold'
                              : 'border-white/5 bg-black/30 text-salon-textSecondary hover:border-white/20',
                          ].join(' ')}
                        >
                          Any Barber
                        </button>
                        {barbers.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            disabled={b.availability === 'ON_BREAK' || b.availability === 'OFF_DUTY'}
                            onClick={() => setWalkInBarberId(b.id)}
                            className={[
                              'p-2 rounded-xl border text-xs text-center transition-colors truncate',
                              walkInBarberId === b.id
                                ? 'border-salon-gold bg-salon-gold/15 text-white font-bold'
                                : 'border-white/5 bg-black/30 text-salon-textSecondary hover:border-white/20',
                              b.availability === 'ON_BREAK' || b.availability === 'OFF_DUTY'
                                ? 'opacity-40 cursor-not-allowed'
                                : '',
                            ].join(' ')}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setShowWalkInModal(false)}
                      >
                        {t('reception.dismiss')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        loading={walkInSubmitting}
                        disabled={walkInSubmitting}
                      >
                        {t('reception.addWalkIn')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* NO-SHOW CONFIRMATION MODAL */}
          {noShowTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1E1E1E] p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-6 w-6 shrink-0" />
                  <h3 className="text-lg font-bold text-white font-serif">
                    {t('reception.noShowModalTitle')}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-salon-textSecondary leading-relaxed">
                  {t('reception.noShowModalDesc', {
                    token: noShowTarget.tokenNumber,
                    name: noShowTarget.customerName,
                    barber: noShowTarget.assignedBarber?.name || 'Stylist',
                  })}
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNoShowTarget(null)}
                    disabled={noShowSubmitting}
                  >
                    {t('reception.dismiss')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={noShowSubmitting}
                    disabled={noShowSubmitting}
                    onClick={handleConfirmNoShow}
                  >
                    {t('reception.confirmNoShow')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* CANCEL CONFIRMATION MODAL */}
          {cancelTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1E1E1E] p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="h-6 w-6 shrink-0" />
                  <h3 className="text-lg font-bold text-white font-serif">
                    {t('reception.cancelModalTitle')}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-salon-textSecondary leading-relaxed">
                  {t('reception.cancelModalDesc', {
                    token: cancelTarget.tokenNumber,
                    name: cancelTarget.customerName,
                  })}
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTarget(null)}
                    disabled={cancelSubmitting}
                  >
                    {t('reception.dismiss')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancelSubmitting}
                    disabled={cancelSubmitting}
                    onClick={handleConfirmCancel}
                  >
                    {t('reception.confirmCancel')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </StaffLayout>
  );
}
