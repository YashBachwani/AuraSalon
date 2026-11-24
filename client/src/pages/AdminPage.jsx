import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  History,
  Key,
  Loader2,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Scissors,
  Settings,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { StaffLayout } from '../layouts/StaffLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, BarberAvailabilityBadge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatInr, formatTime12, formatTime24To12, getInitials, maskPhone } from '../utils/formatters.js';

const COLOR_SWATCHES = [
  '#D4A017', // Gold
  '#C89B45', // Antique Gold
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#14B8A6', // Teal
];

export function AdminPage() {
  const { bootstrap, refreshBootstrap, socketStatus } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  const [activeTab, setActiveTab] = useState('stats');
  const [selectedRange, setSelectedRange] = useState('today'); // 'today' | '7d' | '30d' | 'all'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Management State: Services
  const [adminServices, setAdminServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesFilter, setServicesFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState('create'); // 'create' | 'edit'
  const [serviceForm, setServiceForm] = useState({
    id: null,
    nameEn: '',
    nameGu: '',
    descriptionEn: '',
    descriptionGu: '',
    durationMinutes: 30,
    priceInr: 350,
    isActive: true,
  });
  const [serviceFormError, setServiceFormError] = useState(null);
  const [serviceFormSubmitting, setServiceFormSubmitting] = useState(false);
  const [serviceDeleteModalOpen, setServiceDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [serviceDeleteSubmitting, setServiceDeleteSubmitting] = useState(false);

  // Management State: Barbers
  const [adminBarbers, setAdminBarbers] = useState([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [barbersFilter, setBarbersFilter] = useState('all'); // 'all' | 'onDuty' | 'offDuty'
  const [barberModalOpen, setBarberModalOpen] = useState(false);
  const [barberModalMode, setBarberModalMode] = useState('create'); // 'create' | 'edit'
  const [barberForm, setBarberForm] = useState({
    id: null,
    name: '',
    slug: '',
    specialty: 'Master Stylist',
    phone: '',
    avatarColor: '#D4A017',
    pin: '1234',
    isOnDuty: true,
  });
  const [barberFormError, setBarberFormError] = useState(null);
  const [barberFormSubmitting, setBarberFormSubmitting] = useState(false);
  const [barberDeleteModalOpen, setBarberDeleteModalOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState(null);
  const [barberDeleteSubmitting, setBarberDeleteSubmitting] = useState(false);
  const [barberDeleteError, setBarberDeleteError] = useState(null);

  // Notification / Feedback banner
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  // Time-based greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12
    ? t('admin.greetingMorning')
    : currentHour < 17
      ? t('admin.greetingAfternoon')
      : t('admin.greetingEvening');

  // Fetch Authoritative Owner Analytics
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

  // Fetch Admin Services
  const fetchAdminServices = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setServicesLoading(true);
    try {
      const res = await api.getAdminServices();
      if (res?.services) {
        setAdminServices(res.services);
      }
    } catch (err) {
      console.error('Failed to load admin services:', err);
    } finally {
      if (!silent) setServicesLoading(false);
    }
  }, []);

  // Fetch Admin Barbers
  const fetchAdminBarbers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setBarbersLoading(true);
    try {
      const res = await api.getAdminBarbers();
      if (res?.barbers) {
        setAdminBarbers(res.barbers);
      }
    } catch (err) {
      console.error('Failed to load admin barbers:', err);
    } finally {
      if (!silent) setBarbersLoading(false);
    }
  }, []);

  // Load analytics on range change
  useEffect(() => {
    fetchAnalytics({ silent: false, range: selectedRange });
  }, [fetchAnalytics, selectedRange]);

  // Fallback periodic refresh for owner analytics when socket is offline / serverless
  useEffect(() => {
    if (socketStatus === 'live') return;
    const interval = setInterval(() => {
      if (activeTab === 'stats') {
        fetchAnalytics({ silent: true, range: selectedRange });
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [socketStatus, activeTab, fetchAnalytics, selectedRange]);

  // Load data on tab switch
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchAnalytics({ silent: true, range: selectedRange });
    } else if (activeTab === 'services') {
      fetchAdminServices();
    } else if (activeTab === 'barbers') {
      fetchAdminBarbers();
    }
  }, [activeTab, fetchAnalytics, fetchAdminServices, fetchAdminBarbers, selectedRange]);

  // Tab visibility refresh: re-fetch immediately when user returns to this tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (activeTab === 'stats') {
          fetchAnalytics({ silent: true, range: selectedRange });
        } else if (activeTab === 'services') {
          fetchAdminServices({ silent: true });
        } else if (activeTab === 'barbers') {
          fetchAdminBarbers({ silent: true });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, fetchAnalytics, fetchAdminServices, fetchAdminBarbers, selectedRange]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    const socket = getSocket();

    const handleRealtimeAnalytics = () => {
      fetchAnalytics({ silent: true });
    };

    const handleServicesUpdated = () => {
      fetchAdminServices({ silent: true });
      refreshBootstrap({ silent: true });
    };

    const handleBarbersUpdated = () => {
      fetchAdminBarbers({ silent: true });
      refreshBootstrap({ silent: true });
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
      'salon:settings-updated',
    ];

    events.forEach((evt) => socket.on(evt, handleRealtimeAnalytics));
    socket.on('services:updated', handleServicesUpdated);
    socket.on('barbers:updated', handleBarbersUpdated);
    socket.on('connect', () => {
      handleRealtimeAnalytics();
      handleServicesUpdated();
      handleBarbersUpdated();
    });
    socket.on('reconnect', () => {
      handleRealtimeAnalytics();
      handleServicesUpdated();
      handleBarbersUpdated();
    });

    return () => {
      events.forEach((evt) => socket.off(evt, handleRealtimeAnalytics));
      socket.off('services:updated', handleServicesUpdated);
      socket.off('barbers:updated', handleBarbersUpdated);
      socket.off('connect', handleRealtimeAnalytics);
      socket.off('reconnect', handleRealtimeAnalytics);
    };
  }, [fetchAnalytics, fetchAdminServices, fetchAdminBarbers, refreshBootstrap]);

  // ----------------------------------------------------
  // SERVICE ACTIONS
  // ----------------------------------------------------
  const handleOpenCreateService = () => {
    setServiceForm({
      id: null,
      nameEn: '',
      nameGu: '',
      descriptionEn: '',
      descriptionGu: '',
      durationMinutes: 30,
      priceInr: 350,
      isActive: true,
    });
    setServiceFormError(null);
    setServiceModalMode('create');
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setServiceForm({
      id: service.id,
      nameEn: service.nameEn || '',
      nameGu: service.nameGu || '',
      descriptionEn: service.descriptionEn || '',
      descriptionGu: service.descriptionGu || '',
      durationMinutes: service.durationMinutes || 30,
      priceInr: service.priceInr || 0,
      isActive: Boolean(service.isActive),
    });
    setServiceFormError(null);
    setServiceModalMode('edit');
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const trimmedEn = serviceForm.nameEn.trim();
    if (!trimmedEn || trimmedEn.length < 2) {
      setServiceFormError('Service name in English is required (at least 2 characters).');
      return;
    }
    const duration = Number(serviceForm.durationMinutes);
    if (!duration || duration <= 0 || duration > 240) {
      setServiceFormError('Duration must be between 1 and 240 minutes.');
      return;
    }
    const price = Number(serviceForm.priceInr);
    if (isNaN(price) || price < 0) {
      setServiceFormError('Price must be a valid non-negative amount.');
      return;
    }

    setServiceFormSubmitting(true);
    setServiceFormError(null);

    try {
      const payload = {
        nameEn: trimmedEn,
        nameGu: serviceForm.nameGu.trim() || trimmedEn,
        descriptionEn: serviceForm.descriptionEn.trim(),
        descriptionGu: serviceForm.descriptionGu.trim(),
        durationMinutes: duration,
        priceInr: price,
        isActive: Boolean(serviceForm.isActive),
      };

      if (serviceModalMode === 'create') {
        await api.createAdminService(payload);
        showFeedback('success', t('admin.serviceCreatedSuccess'));
      } else {
        await api.updateAdminService(serviceForm.id, payload);
        showFeedback('success', t('admin.serviceUpdatedSuccess'));
      }

      setServiceModalOpen(false);
      fetchAdminServices({ silent: true });
      refreshBootstrap({ silent: true });
    } catch (err) {
      setServiceFormError(err.message || 'Failed to save service.');
    } finally {
      setServiceFormSubmitting(false);
    }
  };

  const handleToggleServiceStatus = async (service) => {
    try {
      await api.updateAdminService(service.id, {
        isActive: !service.isActive,
      });
      showFeedback('success', service.isActive ? 'Service marked inactive.' : 'Service marked active.');
      fetchAdminServices({ silent: true });
      refreshBootstrap({ silent: true });
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update service status.');
    }
  };

  const handleOpenDeleteService = (service) => {
    setServiceToDelete(service);
    setServiceDeleteModalOpen(true);
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setServiceDeleteSubmitting(true);
    try {
      const res = await api.deleteAdminService(serviceToDelete.id);
      showFeedback('success', res.message || t('admin.serviceDeletedSuccess'));
      setServiceDeleteModalOpen(false);
      setServiceToDelete(null);
      fetchAdminServices({ silent: true });
      refreshBootstrap({ silent: true });
    } catch (err) {
      showFeedback('error', err.message || 'Failed to delete or deactivate service.');
    } finally {
      setServiceDeleteSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // BARBER ACTIONS
  // ----------------------------------------------------
  const handleOpenCreateBarber = () => {
    setBarberForm({
      id: null,
      name: '',
      slug: '',
      specialty: 'Master Stylist',
      phone: '',
      avatarColor: '#D4A017',
      pin: '1234',
      isOnDuty: true,
    });
    setBarberFormError(null);
    setBarberModalMode('create');
    setBarberModalOpen(true);
  };

  const handleBarberNameChange = (val) => {
    setBarberForm((prev) => {
      const updated = { ...prev, name: val };
      if (barberModalMode === 'create' && !prev.slugManual) {
        updated.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9_-]/g, '-')
          .replace(/-+/g, '-');
      }
      return updated;
    });
  };

  const handleOpenEditBarber = (barber) => {
    setBarberForm({
      id: barber.id,
      name: barber.name,
      slug: barber.slug,
      specialty: barber.specialty || '',
      phone: barber.phone || '',
      avatarColor: barber.avatarColor || '#D4A017',
      pin: '', // Leave blank unless updating
      isOnDuty: Boolean(barber.isOnDuty),
      slugManual: true,
    });
    setBarberFormError(null);
    setBarberModalMode('edit');
    setBarberModalOpen(true);
  };

  const handleSaveBarber = async (e) => {
    e.preventDefault();
    const trimmedName = barberForm.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setBarberFormError('Stylist name is required (at least 2 characters).');
      return;
    }
    const trimmedSlug = barberForm.slug.trim().toLowerCase();
    if (!trimmedSlug) {
      setBarberFormError('A unique slug / URL identifier is required.');
      return;
    }

    setBarberFormSubmitting(true);
    setBarberFormError(null);

    try {
      const payload = {
        name: trimmedName,
        slug: trimmedSlug,
        specialty: barberForm.specialty.trim() || 'Master Stylist',
        phone: barberForm.phone.trim(),
        avatarColor: barberForm.avatarColor || '#D4A017',
        isOnDuty: Boolean(barberForm.isOnDuty),
      };
      if (barberForm.pin) {
        payload.pin = barberForm.pin.trim();
      }

      if (barberModalMode === 'create') {
        await api.createAdminBarber(payload);
        showFeedback('success', t('admin.barberCreatedSuccess'));
      } else {
        await api.updateAdminBarber(barberForm.id, payload);
        showFeedback('success', t('admin.barberUpdatedSuccess'));
      }

      setBarberModalOpen(false);
      fetchAdminBarbers({ silent: true });
      refreshBootstrap({ silent: true });
    } catch (err) {
      setBarberFormError(err.message || 'Failed to save barber profile.');
    } finally {
      setBarberFormSubmitting(false);
    }
  };

  const handleToggleBarberDuty = async (barber) => {
    try {
      await api.updateAdminBarber(barber.id, {
        isOnDuty: !barber.isOnDuty,
      });
      showFeedback('success', barber.isOnDuty ? 'Barber marked off duty.' : 'Barber marked on duty.');
      fetchAdminBarbers({ silent: true });
      refreshBootstrap({ silent: true });
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update barber duty status.');
    }
  };

  const handleOpenDeleteBarber = (barber) => {
    setBarberToDelete(barber);
    setBarberDeleteError(null);
    setBarberDeleteModalOpen(true);
  };

  const handleConfirmDeleteBarber = async () => {
    if (!barberToDelete) return;
    setBarberDeleteSubmitting(true);
    setBarberDeleteError(null);

    try {
      const res = await api.deleteAdminBarber(barberToDelete.id);
      showFeedback('success', res.message || t('admin.barberDeletedSuccess'));
      setBarberDeleteModalOpen(false);
      setBarberToDelete(null);
      fetchAdminBarbers({ silent: true });
      refreshBootstrap({ silent: true });
    } catch (err) {
      setBarberDeleteError(err.message || 'Failed to remove or deactivate barber.');
    } finally {
      setBarberDeleteSubmitting(false);
    }
  };

  // Filtered Services
  const filteredServices = adminServices.filter((svc) => {
    if (servicesFilter === 'active') return svc.isActive;
    if (servicesFilter === 'inactive') return !svc.isActive;
    return true;
  });

  // Filtered Barbers
  const filteredBarbers = adminBarbers.filter((b) => {
    if (barbersFilter === 'onDuty') return b.isOnDuty;
    if (barbersFilter === 'offDuty') return !b.isOnDuty;
    return true;
  });

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
  const rangeOverview = analytics?.rangeOverview || {};
  const revenue = analytics?.revenueOverview || {};
  const customerMetrics = analytics?.customerMetrics || {};
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
        {/* Feedback / Notification Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="secondary"
              size="md"
              loading={refreshing}
              leftIcon={RefreshCw}
              onClick={() => {
                if (activeTab === 'stats') fetchAnalytics({ silent: false, range: selectedRange });
                else if (activeTab === 'services') fetchAdminServices({ silent: false });
                else if (activeTab === 'barbers') fetchAdminBarbers({ silent: false });
              }}
            >
              {t('admin.refreshStats')}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                data-tab={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#C89B45] text-[#191817] shadow-lg shadow-[#C89B45]/20 font-bold'
                    : 'text-[#D9D0C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#191817]' : 'text-[#C89B45]'}`} />
                <span>{tab.label}</span>
                {tab.id === 'services' && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? 'bg-[#191817]/20 text-[#191817]' : 'bg-white/10 text-white/80'}`}>
                    {adminServices.length || bootstrap?.counts?.activeServices || 0}
                  </span>
                )}
                {tab.id === 'barbers' && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? 'bg-[#191817]/20 text-[#191817]' : 'bg-white/10 text-white/80'}`}>
                    {adminBarbers.length || bootstrap?.counts?.onDutyBarbers || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* TAB 1: OWNER ANALYTICS & STATS                       */}
        {/* ==================================================== */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Time Range Filter Selector */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-[#292622] rounded-xl border border-white/5">
                {ranges.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRange(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedRange === r.id
                        ? 'bg-[#C89B45] text-[#191817]'
                        : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {lastUpdated && (
                <span className="text-[11px] text-[#A8A096] tabular-nums">
                  Updated {formatTime12(lastUpdated.toISOString())}
                </span>
              )}
            </div>

            {loading ? (
              <LoadingState message="Loading owner analytics & metrics..." />
            ) : error ? (
              <ErrorState title="Analytics Error" message={error} onRetry={() => fetchAnalytics({ silent: false })} />
            ) : (
              <>
                {/* Primary KPI Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Total Customers */}
                  <Card elevated className="p-4 sm:p-5 bg-[#292622]/90 border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#A8A096] uppercase tracking-wider">
                        {t('admin.kpiTotalCustomers')}
                      </span>
                      <Users className="h-4 w-4 text-[#C89B45]" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {selectedRange === 'today'
                          ? (today.totalRegistrationsToday ?? today.totalCustomersToday ?? 0)
                          : (rangeOverview.totalRegistrationsInRange ?? queueStats.totalRegistrationsInRange ?? 0)}
                      </span>
                      <span className="text-[11px] text-[#A8A096]">
                        {selectedRange === 'today' ? 'today' : selectedRange}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#D9D0C2] flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-emerald-400" />
                      <span>{t('admin.kpiUniqueCustomers', { count: customerMetrics.totalUniqueCustomers ?? today.totalAllTimeCustomers ?? 0 })}</span>
                    </p>
                  </Card>

                  {/* Customers Served */}
                  <Card elevated className="p-4 sm:p-5 bg-[#292622]/90 border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#A8A096] uppercase tracking-wider">
                        {t('admin.kpiServed')}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">
                        {selectedRange === 'today'
                          ? (today.completedToday ?? today.completedCount ?? 0)
                          : (rangeOverview.completedInRange ?? queueStats.completedInRange ?? 0)}
                      </span>
                      <span className="text-[11px] text-[#A8A096]">
                        {t('admin.kpiCompletionRate')}: {selectedRange === 'today'
                          ? (today.completionRatePercent ?? today.completionRate ?? 0)
                          : (rangeOverview.completionRatePercent ?? queueStats.completionRatePercent ?? 0)}%
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#A8A096]">
                      Services: <strong className="text-white tabular-nums">
                        {selectedRange === 'today'
                          ? (today.servicesCompletedToday ?? today.completedCount ?? 0)
                          : (rangeOverview.servicesCompletedInRange ?? queueStats.servicesCompletedInRange ?? 0)}
                      </strong>
                    </p>
                  </Card>

                  {/* Active Queue (Waiting + In Chair) */}
                  <Card elevated className="p-4 sm:p-5 bg-[#292622]/90 border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#A8A096] uppercase tracking-wider">
                        {t('admin.kpiWaiting')}
                      </span>
                      <Clock className="h-4 w-4 text-[#C89B45]" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {today.waitingCount ?? 0}
                      </span>
                      <span className="text-[11px] text-amber-400">
                        + {today.inChairCount ?? today.servingCount ?? 0} in chair
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#A8A096]">
                      Avg Wait: <strong className="text-white tabular-nums">{queueStats.avgActualWaitMinutes ?? queueStats.avgWaitMinutes ?? 0} mins</strong>
                    </p>
                  </Card>

                  {/* Estimated Revenue */}
                  <Card elevated className="p-4 sm:p-5 bg-[#292622]/90 border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#A8A096] uppercase tracking-wider">
                        {selectedRange === 'today' ? t('admin.kpiRevenueToday') : `${t('admin.kpiRevenueToday')} (${selectedRange})`}
                      </span>
                      <DollarSign className="h-4 w-4 text-[#C89B45]" />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#C89B45] tabular-nums">
                        {formatInr(selectedRange === 'today'
                          ? (revenue.revenueTodayInr ?? revenue.todayRevenue ?? 0)
                          : (revenue.revenueInRangeInr ?? revenue.revenueInRange ?? 0))}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-[#A8A096] truncate">
                      {t('admin.kpiWeeklyRevenue', { amount: formatInr(revenue.revenueLast7DaysInr ?? revenue.weeklyRevenue ?? 0) })}
                    </p>
                  </Card>
                </div>

                {/* Queue Status Breakdown Strip (Separating Completed, In Chair, Waiting, Called, No-Show, Cancelled) */}
                <div className="p-4 bg-[#292622]/80 border border-white/5 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-[#C89B45]" />
                      <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                        Queue Status Breakdown ({selectedRange === 'today' ? 'Today' : selectedRange.toUpperCase()})
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#A8A096]">
                      Authoritative real-time ticket states from the database
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {/* Completed */}
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                      <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Completed</span>
                      <span className="text-lg font-bold text-emerald-300 tabular-nums">
                        {selectedRange === 'today' ? (today.completedToday ?? today.completedCount ?? 0) : (rangeOverview.completedInRange ?? 0)}
                      </span>
                    </div>
                    {/* In Chair */}
                    <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                      <span className="text-[10px] text-amber-400 font-semibold block uppercase">In Chair</span>
                      <span className="text-lg font-bold text-amber-300 tabular-nums">
                        {today.inChairCount ?? today.servingCount ?? 0}
                      </span>
                    </div>
                    {/* Waiting */}
                    <div className="p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl">
                      <span className="text-[10px] text-blue-400 font-semibold block uppercase">Waiting</span>
                      <span className="text-lg font-bold text-blue-300 tabular-nums">
                        {today.waitingCount ?? 0}
                      </span>
                    </div>
                    {/* Called */}
                    <div className="p-2.5 bg-purple-950/20 border border-purple-500/20 rounded-xl">
                      <span className="text-[10px] text-purple-400 font-semibold block uppercase">Called</span>
                      <span className="text-lg font-bold text-purple-300 tabular-nums">
                        {today.calledCount ?? 0}
                      </span>
                    </div>
                    {/* No-Shows (Strictly separated) */}
                    <div className="p-2.5 bg-orange-950/20 border border-orange-500/20 rounded-xl">
                      <span className="text-[10px] text-orange-400 font-semibold block uppercase">No-Show</span>
                      <span className="text-lg font-bold text-orange-300 tabular-nums">
                        {selectedRange === 'today' ? (today.noShowCount ?? 0) : (rangeOverview.noShowInRange ?? 0)}
                      </span>
                    </div>
                    {/* Cancelled (Strictly separated) */}
                    <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 rounded-xl">
                      <span className="text-[10px] text-rose-400 font-semibold block uppercase">Cancelled</span>
                      <span className="text-lg font-bold text-rose-300 tabular-nums">
                        {selectedRange === 'today' ? (today.cancelledCount ?? 0) : (rangeOverview.cancelledInRange ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Row: Service Popularity & Barber Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Service Popularity */}
                  <Card elevated className="p-5 bg-[#292622]/90 border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#C89B45]" />
                          <span>{t('admin.servicePopularityTitle')}</span>
                        </h3>
                        <p className="text-xs text-[#A8A096]">Most requested grooming services</p>
                      </div>
                      {mostPopular && (
                        <Badge tone="gold" size="sm">
                          Top: {mostPopular.nameEn}
                        </Badge>
                      )}
                    </div>

                    {serviceStats.length === 0 ? (
                      <p className="py-8 text-center text-xs text-[#A8A096]">{t('admin.noDataAvailable')}</p>
                    ) : (
                      <div className="space-y-3">
                        {serviceStats.slice(0, 6).map((svc) => {
                          const pct = Math.round((Number(svc.selectedCount || 0) / maxSelectedCount) * 100);
                          return (
                            <div key={svc.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white">
                                  {getLocalizedName(svc.nameEn, svc.nameGu)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[#A8A096] tabular-nums">
                                    {t('admin.serviceSelectedTimes', { count: svc.selectedCount })}
                                  </span>
                                  <span className="font-bold text-[#C89B45] tabular-nums">
                                    {formatInr(svc.completedRevenueInr)}
                                  </span>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#C89B45] to-[#E8C982] rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* Stylist Performance */}
                  <Card elevated className="p-5 bg-[#292622]/90 border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-[#C89B45]" />
                          <span>{t('admin.barberPerformanceTitle')}</span>
                        </h3>
                        <p className="text-xs text-[#A8A096]">Completed tickets and chair utilization</p>
                      </div>
                      <Badge tone="neutral" size="sm">
                        {barberPerformance.length} Barbers Active
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {barberPerformance.map((bp) => (
                        <div key={bp.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-[#191817] shrink-0"
                              style={{ backgroundColor: bp.avatarColor || '#D4A017' }}
                            >
                              {getInitials(bp.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{bp.name}</p>
                              <p className="text-xs text-[#A8A096]">{bp.specialty}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right shrink-0">
                            <div>
                              <span className="text-[10px] text-[#A8A096] block uppercase">Done</span>
                              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                                {bp.customersCompletedToday}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#A8A096] block uppercase">Revenue</span>
                              <span className="text-sm font-bold text-[#C89B45] tabular-nums">
                                {formatInr(bp.revenueTodayInr)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Recent Queue Activity Feed */}
                <Card elevated className="p-5 sm:p-6 bg-[#292622]/90 border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                        <History className="h-4 w-4 text-[#C89B45]" />
                        <span>{t('admin.recentActivityTitle')}</span>
                      </h3>
                      <p className="text-xs text-[#A8A096]">Latest customer registrations and queue events</p>
                    </div>
                  </div>

                  {recentActivity.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#A8A096]">{t('admin.noRecentActivity')}</p>
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
              </>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: SERVICES MANAGEMENT                           */}
        {/* ==================================================== */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            {/* Header + Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-serif">{t('admin.manageServicesTitle')}</h3>
                <p className="text-xs text-[#A8A096]">{t('admin.manageServicesDesc')}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filter Pills */}
                <div className="flex items-center p-1 bg-[#292622] rounded-xl border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setServicesFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      servicesFilter === 'all' ? 'bg-[#C89B45] text-[#191817] font-bold' : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {t('admin.filterAll')} ({adminServices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServicesFilter('active')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      servicesFilter === 'active' ? 'bg-[#C89B45] text-[#191817] font-bold' : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {t('admin.filterActive')} ({adminServices.filter((s) => s.isActive).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServicesFilter('inactive')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      servicesFilter === 'inactive' ? 'bg-[#C89B45] text-[#191817] font-bold' : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {t('admin.filterInactive')} ({adminServices.filter((s) => !s.isActive).length})
                  </button>
                </div>

                <Button
                  id="btn-add-service"
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  onClick={handleOpenCreateService}
                >
                  {t('admin.addServiceBtn')}
                </Button>
              </div>
            </div>

            {/* Services Grid / Table */}
            {servicesLoading ? (
              <LoadingState message="Loading salon services..." />
            ) : filteredServices.length === 0 ? (
              <Card elevated className="p-10 text-center bg-[#292622]/90 border-white/5 space-y-3">
                <p className="text-sm text-[#A8A096]">{t('admin.noServicesFound')}</p>
                <Button variant="outline" size="sm" onClick={handleOpenCreateService} leftIcon={Plus}>
                  {t('admin.addServiceBtn')}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((svc) => (
                  <Card
                    key={svc.id}
                    elevated
                    className={`p-5 bg-[#292622]/90 border transition-all duration-200 flex flex-col justify-between ${
                      svc.isActive ? 'border-white/5 hover:border-[#C89B45]/40' : 'border-rose-950/40 opacity-70 bg-[#221f1d]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-white font-serif">
                            {svc.nameEn}
                          </h4>
                          {svc.nameGu && svc.nameGu !== svc.nameEn && (
                            <p className="text-xs text-[#C89B45] font-serif font-medium">{svc.nameGu}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleServiceStatus(svc)}
                          title="Toggle Active / Inactive"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                            svc.isActive
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60'
                              : 'bg-white/5 text-[#A8A096] border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${svc.isActive ? 'bg-emerald-400' : 'bg-white/40'}`} />
                          <span>{svc.isActive ? t('admin.serviceActive') : t('admin.serviceInactive')}</span>
                        </button>
                      </div>

                      {/* Description if any */}
                      {(svc.descriptionEn || svc.descriptionGu) && (
                        <p className="text-xs text-[#A8A096] line-clamp-2">
                          {svc.descriptionEn || svc.descriptionGu}
                        </p>
                      )}

                      {/* Meta stats */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center">
                        <div>
                          <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Price</span>
                          <span className="text-sm font-extrabold text-[#C89B45] tabular-nums">
                            {formatInr(svc.priceInr)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Duration</span>
                          <span className="text-sm font-extrabold text-white tabular-nums">
                            ~{svc.durationMinutes}m
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Bookings</span>
                          <span className="text-sm font-extrabold text-[#D9D0C2] tabular-nums">
                            {svc.usageCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5 mt-4">
                      <Button
                        variant="secondary"
                        size="md"
                        leftIcon={Edit2}
                        onClick={() => handleOpenEditService(svc)}
                      >
                        {t('admin.editServiceBtn')}
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        leftIcon={Trash2}
                        onClick={() => handleOpenDeleteService(svc)}
                      >
                        {svc.usageCount > 0 ? t('admin.deactivateServiceBtn') : t('admin.deleteServiceBtn')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: BARBERS ROSTER MANAGEMENT                     */}
        {/* ==================================================== */}
        {activeTab === 'barbers' && (
          <div className="space-y-6">
            {/* Header + Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white font-serif">{t('admin.manageBarbersTitle')}</h3>
                <p className="text-xs text-[#A8A096]">{t('admin.manageBarbersDesc')}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filter Pills */}
                <div className="flex items-center p-1 bg-[#292622] rounded-xl border border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => setBarbersFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      barbersFilter === 'all' ? 'bg-[#C89B45] text-[#191817] font-bold' : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {t('admin.filterAll')} ({adminBarbers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarbersFilter('onDuty')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      barbersFilter === 'onDuty' ? 'bg-[#C89B45] text-[#191817] font-bold' : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {t('admin.barberOnDuty')} ({adminBarbers.filter((b) => b.isOnDuty).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarbersFilter('offDuty')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      barbersFilter === 'offDuty' ? 'bg-[#C89B45] text-[#191817] font-bold' : 'text-[#A8A096] hover:text-white'
                    }`}
                  >
                    {t('admin.barberOffDuty')} ({adminBarbers.filter((b) => !b.isOnDuty).length})
                  </button>
                </div>

                <Button
                  id="btn-add-barber"
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  onClick={handleOpenCreateBarber}
                >
                  {t('admin.addBarberBtn')}
                </Button>
              </div>
            </div>

            {/* Barbers Grid */}
            {barbersLoading ? (
              <LoadingState message="Loading salon stylists..." />
            ) : filteredBarbers.length === 0 ? (
              <Card elevated className="p-10 text-center bg-[#292622]/90 border-white/5 space-y-3">
                <p className="text-sm text-[#A8A096]">{t('admin.noBarbersFound')}</p>
                <Button variant="outline" size="sm" onClick={handleOpenCreateBarber} leftIcon={Plus}>
                  {t('admin.addBarberBtn')}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBarbers.map((barber) => (
                  <Card
                    key={barber.id}
                    elevated
                    className={`p-5 bg-[#292622]/90 border transition-all duration-200 flex flex-col justify-between ${
                      barber.isOnDuty ? 'border-white/5 hover:border-[#C89B45]/40' : 'border-rose-950/40 opacity-70 bg-[#221f1d]'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Stylist Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-[#191817] shrink-0 shadow-md"
                            style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                          >
                            {getInitials(barber.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-base font-bold text-white truncate font-serif">{barber.name}</h4>
                              {barber.id === 1 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#C89B45]/20 text-[#C89B45] border border-[#C89B45]/30">
                                  Lead
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#A8A096] truncate">{barber.specialty}</p>
                          </div>
                        </div>

                        <BarberAvailabilityBadge availability={barber.availability} />
                      </div>

                      {/* Active Customer Notice if serving */}
                      {barber.activeCustomer && (
                        <div className="p-2.5 rounded-xl bg-[#C89B45]/10 border border-[#C89B45]/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[#C89B45]" />
                            <span className="text-white font-medium">Serving #{barber.activeCustomer.tokenNumber}</span>
                          </div>
                          <span className="text-[11px] text-[#C89B45] font-semibold">{barber.activeCustomer.customerName}</span>
                        </div>
                      )}

                      {/* Meta Details */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Chair ID</span>
                          <span className="font-extrabold text-white tabular-nums">#{barber.id}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Completed</span>
                          <span className="font-extrabold text-emerald-400 tabular-nums">{barber.completedCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#A8A096] block uppercase tracking-wider">Duty</span>
                          <button
                            type="button"
                            onClick={() => handleToggleBarberDuty(barber)}
                            className={`text-[11px] font-bold uppercase transition-colors ${
                              barber.isOnDuty ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'
                            }`}
                          >
                            {barber.isOnDuty ? 'On Duty' : 'Off Duty'}
                          </button>
                        </div>
                      </div>

                      {/* Identifier & Contact */}
                      <div className="text-[11px] text-[#A8A096] space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Slug:</span>
                          <code className="text-[#D9D0C2] bg-white/5 px-1.5 py-0.5 rounded">/barber/{barber.slug}</code>
                        </div>
                        {barber.phone && (
                          <div className="flex items-center justify-between">
                            <span>Phone:</span>
                            <span className="text-[#D9D0C2] tabular-nums">{maskPhone(barber.phone)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5 mt-4">
                      <Button
                        variant="secondary"
                        size="md"
                        leftIcon={Edit2}
                        onClick={() => handleOpenEditBarber(barber)}
                      >
                        {t('admin.editBarberBtn')}
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        leftIcon={Trash2}
                        onClick={() => handleOpenDeleteBarber(barber)}
                      >
                        {t('admin.deleteBarberBtn')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: QUEUE SETTINGS & OPERATING HOURS              */}
        {/* ==================================================== */}
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

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT SERVICE                            */}
      {/* ==================================================== */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#191817] border border-[#C89B45]/30 rounded-2xl p-6 shadow-2xl space-y-5 text-salon-text">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {serviceModalMode === 'create' ? t('admin.addServiceBtn') : `${t('admin.editServiceBtn')}: ${serviceForm.nameEn}`}
                </h3>
                <p className="text-xs text-[#A8A096]">Define pricing, duration, and bilingual naming</p>
              </div>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {serviceFormError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{serviceFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="svc-name-en"
                  label={t('admin.serviceNameEn')}
                  value={serviceForm.nameEn}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameEn: e.target.value })}
                  placeholder="e.g. Royal Beard Sculpt"
                  required
                />
                <Input
                  id="svc-name-gu"
                  label={t('admin.serviceNameGu')}
                  value={serviceForm.nameGu}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameGu: e.target.value })}
                  placeholder="e.g. રોયલ બિયર્ડ સ્કલ્પ્ટ"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="svc-price"
                  type="number"
                  min="0"
                  step="10"
                  label={t('admin.servicePrice')}
                  value={serviceForm.priceInr}
                  onChange={(e) => setServiceForm({ ...serviceForm, priceInr: e.target.value })}
                  prefix="₹"
                  required
                />
                <Input
                  id="svc-duration"
                  type="number"
                  min="5"
                  max="240"
                  step="5"
                  label={t('admin.serviceDuration')}
                  value={serviceForm.durationMinutes}
                  onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                  required
                />
              </div>

              <Input
                id="svc-desc-en"
                label={t('admin.serviceDescEn')}
                value={serviceForm.descriptionEn}
                onChange={(e) => setServiceForm({ ...serviceForm, descriptionEn: e.target.value })}
                placeholder="Brief summary of what this service includes"
              />

              <Input
                id="svc-desc-gu"
                label={t('admin.serviceDescGu')}
                value={serviceForm.descriptionGu}
                onChange={(e) => setServiceForm({ ...serviceForm, descriptionGu: e.target.value })}
                placeholder="ગુજરાતીમાં સંક્ષિપ્ત વિગતો"
              />

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-sm font-semibold text-white block">{t('admin.serviceStatus')}</span>
                  <span className="text-xs text-[#A8A096]">
                    {serviceForm.isActive ? 'Active and selectable by customers' : 'Inactive (hidden from customer catalog)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceForm({ ...serviceForm, isActive: !serviceForm.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    serviceForm.isActive ? 'bg-[#C89B45]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#191817] shadow transform transition-transform ${
                      serviceForm.isActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setServiceModalOpen(false)}
                  disabled={serviceFormSubmitting}
                >
                  {t('admin.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={serviceFormSubmitting}
                >
                  {t('admin.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE / DEACTIVATE SERVICE CONFIRMATION      */}
      {/* ==================================================== */}
      {serviceDeleteModalOpen && serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#191817] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">
                  {serviceToDelete.usageCount > 0 ? t('admin.deactivateServiceBtn') : t('admin.deleteServiceBtn')}
                </h3>
                <p className="text-xs text-[#A8A096]">{serviceToDelete.nameEn}</p>
              </div>
            </div>

            <p className="text-xs text-[#D9D0C2] leading-relaxed">
              {serviceToDelete.usageCount > 0
                ? t('admin.confirmDeactivateService')
                : t('admin.confirmDeleteService')}
            </p>

            {serviceToDelete.usageCount > 0 && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-[#A8A096]">
                ℹ️ Past Bookings: <strong className="text-white tabular-nums">{serviceToDelete.usageCount}</strong>.
                Safely deactivating guarantees existing queue tickets and receipts remain completely intact.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setServiceDeleteModalOpen(false)}
                disabled={serviceDeleteSubmitting}
              >
                {t('admin.cancel')}
              </Button>
              <Button
                variant="danger"
                size="md"
                loading={serviceDeleteSubmitting}
                onClick={handleConfirmDeleteService}
              >
                {serviceToDelete.usageCount > 0 ? t('admin.deactivateServiceBtn') : t('admin.deleteServiceBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT BARBER                             */}
      {/* ==================================================== */}
      {barberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#191817] border border-[#C89B45]/30 rounded-2xl p-6 shadow-2xl space-y-5 text-salon-text">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {barberModalMode === 'create' ? t('admin.addBarberBtn') : `${t('admin.editBarberBtn')}: ${barberForm.name}`}
                </h3>
                <p className="text-xs text-[#A8A096]">Manage stylist profile, chair identifier, and credentials</p>
              </div>
              <button
                type="button"
                onClick={() => setBarberModalOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {barberFormError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{barberFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBarber} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="barber-name"
                  label={t('admin.barberName')}
                  value={barberForm.name}
                  onChange={(e) => handleBarberNameChange(e.target.value)}
                  placeholder="e.g. Isha, Amit, Imran"
                  required
                />
                <Input
                  id="barber-slug"
                  label={t('admin.barberSlug')}
                  value={barberForm.slug}
                  onChange={(e) => setBarberForm({ ...barberForm, slug: e.target.value.toLowerCase(), slugManual: true })}
                  placeholder="e.g. isha, amit"
                  helperText="Used in live URL: /barber/:slug"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="barber-specialty"
                  label={t('admin.barberSpecialty')}
                  value={barberForm.specialty}
                  onChange={(e) => setBarberForm({ ...barberForm, specialty: e.target.value })}
                  placeholder="e.g. Master Stylist & Colorist"
                />
                <Input
                  id="barber-phone"
                  type="tel"
                  label={t('admin.barberPhone')}
                  value={barberForm.phone}
                  onChange={(e) => setBarberForm({ ...barberForm, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>

              {/* Security PIN */}
              <Input
                id="barber-pin"
                type="password"
                maxLength={8}
                label={t('admin.barberPin')}
                value={barberForm.pin}
                onChange={(e) => setBarberForm({ ...barberForm, pin: e.target.value })}
                placeholder={barberModalMode === 'edit' ? 'Leave empty to keep existing PIN' : 'e.g. 1234'}
                helperText="Numeric PIN required for chair dashboard login"
              />

              {/* Avatar Accent Color Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A8A096]">
                  {t('admin.barberColor')}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBarberForm({ ...barberForm, avatarColor: color })}
                      className={`h-8 w-8 rounded-xl transition-all border flex items-center justify-center ${
                        barberForm.avatarColor === color ? 'border-white scale-110 shadow-md ring-2 ring-white/30' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {barberForm.avatarColor === color && <Check className="h-4 w-4 text-[#191817]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duty Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-sm font-semibold text-white block">{t('admin.barberDutyStatus')}</span>
                  <span className="text-xs text-[#A8A096]">
                    {barberForm.isOnDuty ? 'On duty (visible and eligible for assignments)' : 'Off duty (unavailable for new customers)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBarberForm({ ...barberForm, isOnDuty: !barberForm.isOnDuty })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    barberForm.isOnDuty ? 'bg-[#C89B45]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#191817] shadow transform transition-transform ${
                      barberForm.isOnDuty ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setBarberModalOpen(false)}
                  disabled={barberFormSubmitting}
                >
                  {t('admin.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={barberFormSubmitting}
                >
                  {t('admin.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE / DEACTIVATE BARBER CONFIRMATION       */}
      {/* ==================================================== */}
      {barberDeleteModalOpen && barberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#191817] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">{t('admin.deleteBarberBtn')}</h3>
                <p className="text-xs text-[#A8A096]">{barberToDelete.name} ({barberToDelete.specialty})</p>
              </div>
            </div>

            {barberDeleteError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs text-rose-200">
                ⚠️ {barberDeleteError}
              </div>
            )}

            {barberToDelete.activeCustomer ? (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                <p className="font-bold">⚠️ Barber currently has an active customer in chair:</p>
                <p>Token #{barberToDelete.activeCustomer.tokenNumber} ({barberToDelete.activeCustomer.customerName}) is currently {barberToDelete.activeCustomer.status}.</p>
                <p className="text-[11px] text-amber-300">You must complete or reassign this customer before deleting or deactivating the stylist.</p>
              </div>
            ) : (
              <p className="text-xs text-[#D9D0C2] leading-relaxed">
                {barberToDelete.completedCount > 0
                  ? t('admin.confirmDeactivateBarber')
                  : t('admin.confirmDeleteBarber')}
              </p>
            )}

            {barberToDelete.completedCount > 0 && !barberToDelete.activeCustomer && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-[#A8A096]">
                ℹ️ Past Completed Sessions: <strong className="text-white tabular-nums">{barberToDelete.completedCount}</strong>.
                Stylist will be marked Off-Duty and deactivated safely to preserve past appointments and queue logs.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setBarberDeleteModalOpen(false)}
                disabled={barberDeleteSubmitting}
              >
                {t('admin.cancel')}
              </Button>
              <Button
                variant="danger"
                size="md"
                disabled={Boolean(barberToDelete.activeCustomer)}
                loading={barberDeleteSubmitting}
                onClick={handleConfirmDeleteBarber}
              >
                {barberToDelete.completedCount > 0 ? t('admin.deactivateServiceBtn') : t('admin.deleteServiceBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
