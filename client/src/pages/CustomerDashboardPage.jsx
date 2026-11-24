import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  History,
  LogOut,
  Phone,
  Plus,
  Scissors,
  Sparkles,
  Ticket,
  User,
} from 'lucide-react';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { LoadingState } from '../components/ui/StateViews.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatInr, maskPhone } from '../utils/formatters.js';

export function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const { socketStatus } = useConnection();
  const { t, getLocalizedName } = useLanguage();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getCustomerDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load customer profile.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fallback periodic refresh for customer dashboard when socket is offline / serverless
  useEffect(() => {
    if (socketStatus === 'live') return;
    const interval = setInterval(() => {
      fetchDashboard({ silent: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [socketStatus, fetchDashboard]);

  // Real-time synchronization
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      fetchDashboard({ silent: true });
    };

    socket.on('queue:created', handleUpdate);
    socket.on('queue:updated', handleUpdate);
    socket.on('customer:called', handleUpdate);
    socket.on('queue:completed', handleUpdate);
    socket.on('queue:cancelled', handleUpdate);
    socket.on('queue:no-show', handleUpdate);

    return () => {
      socket.off('queue:created', handleUpdate);
      socket.off('queue:updated', handleUpdate);
      socket.off('customer:called', handleUpdate);
      socket.off('queue:completed', handleUpdate);
      socket.off('queue:cancelled', handleUpdate);
      socket.off('queue:no-show', handleUpdate);
    };
  }, [fetchDashboard]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const active = dashboardData?.activeEntry;
  const history = dashboardData?.history || [];

  return (
    <CustomerLayout showBack={false} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Customer Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C89B45]/20 text-[#C89B45] font-extrabold text-lg border border-[#C89B45]/30">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-[#A8A096] uppercase tracking-wider font-semibold">
                {t('customer.welcomeBack') || 'Welcome back,'}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-serif">
                {user?.name || 'Customer'}
              </h1>
              <p className="text-xs text-[#A8A096] tabular-nums">
                {maskPhone(user?.phone)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/join">
              <Button variant="primary" size="sm" rightIcon={Plus} className="shadow-goldSubtle">
                {t('customer.btnJoinQueue') || 'Join Queue'}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={LogOut}
              onClick={handleLogout}
              className="text-[#A8A096] hover:text-white"
            >
              {t('nav.logout') || 'Logout'}
            </Button>
          </div>
        </div>

        {loading && !dashboardData ? (
          <LoadingState message="Loading your queue status..." />
        ) : (
          <>
            {/* Active Queue Card */}
            {active ? (
              <Card elevated goldAccent className="p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C89B45] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>{t('customer.activeTicketTitle') || 'Active Queue Booking'}</span>
                  </span>
                  <QueueStatusBadge status={active.status} size="md" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-y border-white/5">
                  <div>
                    <span className="text-xs text-[#A8A096] uppercase tracking-wider block">
                      {t('myStatus.tokenNumber') || 'Your Token'}
                    </span>
                    <span className="text-5xl sm:text-6xl font-black text-[#C89B45] tracking-tight tabular-nums">
                      {active.tokenNumber}
                    </span>
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="text-xs text-[#A8A096] uppercase tracking-wider block">
                      {t('myStatus.assignedBarber') || 'Stylist'}
                    </span>
                    <span className="text-base font-bold text-white">
                      {active.barberName || t('join.anyBarberTitle') || 'Any Available Stylist'}
                    </span>
                    <p className="text-xs text-[#C89B45] font-semibold">
                      ~{active.totalDurationMinutes} mins service
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-[#A8A096]">
                    Track live position, notifications and salon updates
                  </span>
                  <Link to={`/status/${active.id}`} className="w-full sm:w-auto">
                    <Button variant="primary" size="md" rightIcon={ArrowRight} fullWidth className="font-bold shadow-goldGlow">
                      {t('customer.openTracker') || 'Open Live Tracker'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <Card elevated className="p-8 text-center space-y-4 border-dashed border-white/10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#C89B45]">
                  <Ticket className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-serif">
                    {t('customer.noActiveBookingTitle') || 'You are not in the queue right now'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A8A096] max-w-sm mx-auto">
                    {t('customer.noActiveBookingDesc') || 'Join our digital queue from anywhere and relax until your turn arrives.'}
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/join">
                    <Button variant="primary" size="lg" rightIcon={ArrowRight} className="font-bold shadow-goldGlow">
                      {t('home.ctaJoin') || 'Join Live Queue'}
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Recent Visit History */}
            <Card elevated>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-[#C89B45]" />
                  <span>{t('customer.recentVisits') || 'Recent Visits'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-xs text-[#A8A096] text-center py-6">
                    {t('customer.noHistoryYet') || 'No previous visits recorded yet.'}
                  </p>
                ) : (
                  <div className="divide-y divide-white/5 space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tabular-nums">
                              {item.tokenNumber}
                            </span>
                            <QueueStatusBadge status={item.status} size="sm" />
                          </div>
                          <p className="text-[#A8A096] text-[11px] mt-0.5">
                            {item.services.map((s) => getLocalizedName(s.nameEn, s.nameGu)).join(', ') || 'Salon Visit'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-[#C89B45] tabular-nums">
                            {formatInr(item.totalPriceInr)}
                          </span>
                          <span className="block text-[10px] text-[#A8A096]">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

