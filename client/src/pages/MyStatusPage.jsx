import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  RotateCcw,
  Scissors,
  Sparkles,
  Ticket,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatInr } from '../utils/formatters.js';

export function MyStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketStatus } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchEntry = useCallback(
    async ({ silent = false } = {}) => {
      if (!id) return;
      if (!silent) setLoading(true);
      try {
        const res = await api.getQueueEntry(id);
        if (res?.entry) {
          setEntry(res.entry);
          setError(null);
        } else {
          setError('ENTRY_NOT_FOUND');
        }
      } catch (err) {
        if (err.status === 404 || err.code === 'ENTRY_NOT_FOUND') {
          setError('ENTRY_NOT_FOUND');
        } else {
          setError(err.message || 'Unable to load ticket details.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  // Socket.IO Real-time synchronization & mobile visibility handling
  useEffect(() => {
    const socket = getSocket();

    const handleQueueUpdate = () => {
      fetchEntry({ silent: true });
    };

    const handleCustomerCalled = (data) => {
      if (
        data &&
        (String(data.entryId) === String(id) || String(data.tokenNumber) === String(id))
      ) {
        // Trigger haptic vibration if supported on mobile
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200, 100, 400]);
          } catch {
            // ignore haptic error
          }
        }
      }
      fetchEntry({ silent: true });
    };

    const handleConnect = () => {
      fetchEntry({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEntry({ silent: true });
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:created', handleQueueUpdate);
    socket.on('queue:called', handleQueueUpdate);
    socket.on('customer:called', handleCustomerCalled);
    socket.on('queue:started', handleQueueUpdate);
    socket.on('queue:completed', handleQueueUpdate);
    socket.on('queue:no-show', handleQueueUpdate);
    socket.on('queue:cancelled', handleQueueUpdate);
    socket.on('barber:updated', handleQueueUpdate);
    socket.on('barbers:updated', handleQueueUpdate);
    socket.on('connect', handleConnect);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:created', handleQueueUpdate);
      socket.off('queue:called', handleQueueUpdate);
      socket.off('customer:called', handleCustomerCalled);
      socket.off('queue:started', handleQueueUpdate);
      socket.off('queue:completed', handleQueueUpdate);
      socket.off('queue:no-show', handleQueueUpdate);
      socket.off('queue:cancelled', handleQueueUpdate);
      socket.off('barber:updated', handleQueueUpdate);
      socket.off('barbers:updated', handleQueueUpdate);
      socket.off('connect', handleConnect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fetchEntry]);

  const handleConfirmCancel = async () => {
    if (!entry) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await api.cancelQueueEntry(entry.id, 'CUSTOMER_CANCELLED');
      if (res?.entry) {
        setEntry(res.entry);
        setShowCancelModal(false);
      }
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel spot.');
    } finally {
      setIsCancelling(false);
    }
  };

  const steps = [
    { key: 'WAITING', label: t('myStatus.stepWaiting'), num: 1 },
    { key: 'CALLED', label: t('myStatus.stepCalled'), num: 2 },
    { key: 'IN_CHAIR', label: t('myStatus.stepInChair'), num: 3 },
    { key: 'DONE', label: t('myStatus.stepDone'), num: 4 },
  ];

  const getStepStatus = (stepKey) => {
    if (!entry) return 'pending';
    const statusOrder = ['WAITING', 'CALLED', 'IN_CHAIR', 'DONE'];
    const currentIndex = statusOrder.indexOf(entry.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (entry.status === 'CANCELLED' || entry.status === 'NO_SHOW') {
      return 'cancelled';
    }
    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
  };

  if (loading && !entry) {
    return (
      <CustomerLayout showBack backTo="/" maxWidth="max-w-xl">
        <LoadingState message={t('common.loading')} />
      </CustomerLayout>
    );
  }

  if (error === 'ENTRY_NOT_FOUND' || !entry) {
    return (
      <CustomerLayout showBack backTo="/" maxWidth="max-w-xl">
        <Card elevated className="text-center p-8 space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <Ticket className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white font-serif">
              {t('myStatus.ticketNotFoundTitle')}
            </h1>
            <p className="text-sm text-salon-textMuted max-w-sm mx-auto">
              {t('myStatus.ticketNotFoundDesc')}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/join">
              <Button variant="primary" size="md" rightIcon={Sparkles}>
                {t('myStatus.joinAgain')}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="md" leftIcon={ArrowLeft}>
                {t('myStatus.backToHome')}
              </Button>
            </Link>
          </div>
        </Card>
      </CustomerLayout>
    );
  }

  const isCalled = entry.status === 'CALLED';
  const isInChair = entry.status === 'IN_CHAIR';
  const isDone = entry.status === 'DONE';
  const isCancelled = entry.status === 'CANCELLED';
  const isNoShow = entry.status === 'NO_SHOW';
  const isWaiting = entry.status === 'WAITING';

  const assignedOrPreferredBarber = entry.assignedBarber || entry.preferredBarber;
  const isBarberOnBreak = assignedOrPreferredBarber?.availability === 'ON_BREAK';

  return (
    <CustomerLayout showBack backTo="/" maxWidth="max-w-xl">
      <div className="space-y-6">
        {/* Full-Screen / Prominent Golden Alert when CALLED (TC-05) */}
        {isCalled && (
          <div className="rounded-3xl border-2 border-salon-gold bg-gradient-to-b from-[#2A2008] to-[#1F1703] p-6 text-center space-y-4 shadow-goldGlow animate-softPulse">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-salon-gold/20 text-salon-gold animate-bounce">
              <Bell className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-salon-gold tracking-tight font-serif">
                {t('myStatus.itsYourTurn')}
              </h2>
              <p className="text-sm sm:text-base text-white font-medium">
                {t('myStatus.proceedToBarber', {
                  barber: entry.assignedBarber?.name || assignedOrPreferredBarber?.name || 'Stylist',
                })}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-salon-gold/10 px-4 py-1.5 text-xs font-semibold text-salon-gold border border-salon-gold/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('myStatus.stepCalled')} — Token {entry.tokenNumber}</span>
            </div>
          </div>
        )}

        {/* Almost Next Alert (TC-06) */}
        {isWaiting && entry.isAlmostNext && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="text-xs sm:text-sm text-amber-200 font-medium">
              {t('myStatus.almostNextAlert')}
            </div>
          </div>
        )}

        {/* Barber on break notice if applicable */}
        {isWaiting && isBarberOnBreak && assignedOrPreferredBarber && (
          <div className="rounded-2xl border border-salon-gold/40 bg-salon-gold/10 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-salon-gold shrink-0" />
            <div className="text-xs sm:text-sm text-salon-gold/90 font-medium">
              {t('myStatus.barberOnBreakNotice', { barber: assignedOrPreferredBarber.name })}
            </div>
          </div>
        )}

        {/* Terminal Status Notices (Completed, Cancelled, No-Show) */}
        {isDone && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs sm:text-sm text-emerald-300 font-medium space-y-2">
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-400" />
            <p>{t('myStatus.ticketDone')}</p>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs sm:text-sm text-red-300 font-medium space-y-2">
            <XCircle className="h-6 w-6 mx-auto text-red-400" />
            <p>{t('myStatus.ticketCancelled')}</p>
          </div>
        )}

        {isNoShow && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs sm:text-sm text-red-300 font-medium space-y-2">
            <AlertCircle className="h-6 w-6 mx-auto text-red-400" />
            <p>{t('myStatus.ticketNoShow')}</p>
          </div>
        )}

        {/* Main Token & Status Card */}
        <Card elevated goldAccent className="overflow-hidden">
          <CardContent className="p-6 sm:p-8 text-center space-y-6">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#202020] px-3.5 py-1.5 text-xs font-medium text-salon-textSecondary">
                <Ticket className="h-3.5 w-3.5 text-salon-gold" />
                <span>{entry.source === 'WALK_IN' ? 'Walk-in' : 'Online'}</span>
              </div>
              <Badge tone="gold">{t('myStatus.liveStatusBadge')}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-salon-textMuted">
                {t('myStatus.tokenNumber')}
              </p>
              <div className="text-6xl sm:text-7xl font-black tracking-tight text-salon-gold tabular-nums drop-shadow-md">
                {entry.tokenNumber}
              </div>
              <p className="text-sm font-semibold text-white">{entry.customerName}</p>
              <div className="pt-1 flex justify-center">
                <QueueStatusBadge status={entry.status} size="lg" />
              </div>
            </div>

            {/* Waiting Metrics (Ahead & Approx Wait) */}
            {isWaiting && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl border border-white/5 bg-black/40 p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                    {Math.max(0, (entry.queuePosition || 1) - 1)}
                  </div>
                  <p className="text-xs text-salon-textMuted mt-1">
                    {t('myStatus.positionInLine')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/40 p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-salon-gold tabular-nums">
                    ~{entry.approxWaitMinutes || 0}
                    <span className="text-xs font-normal ml-1 text-salon-textMuted">
                      {t('myStatus.minutesAbbr')}
                    </span>
                  </div>
                  <p className="text-xs text-salon-textMuted mt-1">
                    {t('myStatus.approxWait')}
                  </p>
                </div>
              </div>
            )}

            {/* 4-Step Queue Journey */}
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-salon-textMuted mb-3">
                {t('myStatus.progressTitle')}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {steps.map((step) => {
                  const state = getStepStatus(step.key);
                  const isCurrent = entry.status === step.key;
                  return (
                    <div
                      key={step.key}
                      className={[
                        'rounded-xl border px-2 py-2.5 text-center transition-all',
                        isCurrent
                          ? 'border-salon-gold bg-salon-gold/15 shadow-sm'
                          : state === 'completed'
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/5 bg-black/30 opacity-60',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                          isCurrent
                            ? 'bg-salon-gold text-salon-deep'
                            : state === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[#222] text-salon-textMuted',
                        ].join(' ')}
                      >
                        {state === 'completed' && !isCurrent ? '✓' : step.num}
                      </div>
                      <span className="block text-[11px] font-medium text-white truncate">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Services & Barber Details Card */}
        <Card elevated>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-salon-gold" />
                <span>{t('myStatus.servicesBooked')}</span>
              </span>
              <span className="text-xs font-normal text-salon-textMuted">
                {entry.services.length} services
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Services List */}
            <div className="space-y-2 divide-y divide-white/5 text-sm">
              {entry.services.map((s) => (
                <div key={s.id} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {getLocalizedName(s.nameEn, s.nameGu)}
                    </p>
                    <p className="text-xs text-salon-textMuted">{s.durationMinutes} mins</p>
                  </div>
                  <span className="font-bold text-salon-gold tabular-nums">
                    {formatInr(s.priceInr)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm">
              <span className="font-bold text-white">{t('join.totalPrice')}</span>
              <span className="text-lg font-extrabold text-salon-gold tabular-nums">
                {formatInr(entry.totalPriceInr)}
              </span>
            </div>

            {/* Barber info */}
            <div className="rounded-xl border border-white/5 bg-black/30 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold text-salon-deep"
                  style={{
                    backgroundColor: assignedOrPreferredBarber?.avatarColor || '#D4A017',
                  }}
                >
                  {assignedOrPreferredBarber ? assignedOrPreferredBarber.name.slice(0, 2) : 'AB'}
                </div>
                <div>
                  <p className="text-xs text-salon-textMuted">{t('myStatus.assignedBarber')}</p>
                  <p className="text-sm font-bold text-white">
                    {assignedOrPreferredBarber ? assignedOrPreferredBarber.name : t('join.anyBarberTitle')}
                  </p>
                </div>
              </div>
              {assignedOrPreferredBarber?.availability && (
                <Badge tone={assignedOrPreferredBarber.availability === 'AVAILABLE' ? 'emerald' : 'gold'}>
                  {assignedOrPreferredBarber.availability}
                </Badge>
              )}
            </div>

            {/* Self-Cancellation Button (Active only when WAITING or CALLED) */}
            {(isWaiting || isCalled) && (
              <div className="pt-2 border-t border-white/5">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-400 hover:text-red-300 hover:border-red-500/50"
                >
                  {t('myStatus.cancelSpot')}
                </Button>
              </div>
            )}

            {/* Terminal Actions */}
            {(isDone || isCancelled || isNoShow) && (
              <div className="pt-2 border-t border-white/5">
                <Link to="/join">
                  <Button variant="primary" fullWidth rightIcon={Sparkles}>
                    {t('myStatus.joinAgain')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1E1E1E] p-6 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <h3 className="text-lg font-bold text-white font-serif">
                  {t('myStatus.cancelModalTitle')}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-salon-textSecondary leading-relaxed">
                {t('myStatus.cancelModalDesc', { token: entry.tokenNumber })}
              </p>

              {cancelError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                >
                  {t('myStatus.keepSpot')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmCancel}
                  loading={isCancelling}
                  disabled={isCancelling}
                >
                  {isCancelling ? t('myStatus.cancelling') : t('myStatus.confirmCancel')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
