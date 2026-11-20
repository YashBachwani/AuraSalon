import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Scissors,
  Sparkles,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { api } from '../services/api.js';
import { PremiumNavbar } from '../components/shared/PremiumNavbar.jsx';
import { PremiumFooter } from '../components/shared/PremiumFooter.jsx';
import { ServiceCard } from '../components/ui/ServiceCard.jsx';
import { BarberCard } from '../components/ui/BarberCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ScrollReveal } from '../components/ui/ScrollReveal.jsx';
import { LoadingState, ErrorState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatInr, formatTime24To12 } from '../utils/formatters.js';

export function JoinQueuePage() {
  const navigate = useNavigate();
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  // Multi-step index: 1 (Details) | 2 (Services) | 3 (Barber) | 4 (Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Controlled form state (preserved across step navigation & language toggling)
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(null); // null = Any Barber

  // Field validation and submission error states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [duplicateEntry, setDuplicateEntry] = useState(null);

  const salon = bootstrap?.salon;
  const services = bootstrap?.services || [];
  const barbers = (bootstrap?.barbers || []).filter((b) => b.isOnDuty);

  // Determine if online joining is closed (manual override OR 30 min before closing)
  const isOnlineJoinClosed = useMemo(() => {
    if (!salon) return false;
    if (salon.isOnlineJoinManuallyClosed) return true;

    // Check 30-minute auto cutoff based on client local time matching salon schedule
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [closeH, closeM] = String(salon.closeTime).split(':').map(Number);
      const [openH, openM] = String(salon.openTime).split(':').map(Number);

      const closeMinutes = closeH * 60 + closeM;
      const openMinutes = openH * 60 + openM;
      const autoCloseMinutes = closeMinutes - 30;

      if (currentMinutes < openMinutes || currentMinutes >= autoCloseMinutes) {
        return true;
      }
    } catch {
      // Fallback to open if time parse fails
    }

    return false;
  }, [salon]);

  // Selected services list with live totals
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.priceInr, 0);
  }, [selectedServices]);

  const selectedBarber = useMemo(() => {
    if (!selectedBarberId) return null;
    return barbers.find((b) => b.id === selectedBarberId) || null;
  }, [barbers, selectedBarberId]);

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errs.name = t('join.errNameRequired');
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      errs.phone = t('join.errPhoneInvalid');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs = {};
    if (selectedServiceIds.length === 0) {
      errs.services = t('join.errServiceRequired');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleToggleService = (service) => {
    setErrors((prev) => ({ ...prev, services: null }));
    setSelectedServiceIds((prev) => {
      if (prev.includes(service.id)) {
        return prev.filter((id) => id !== service.id);
      }
      if (prev.length >= 3) {
        return prev; // Cap at 3
      }
      return [...prev, service.id];
    });
  };

  const handleConfirmReview = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setDuplicateEntry(null);

    try {
      const res = await api.joinQueue({
        customerName: customerName.trim(),
        phone: phone.replace(/\D/g, ''),
        serviceIds: selectedServiceIds,
        preferredBarberId: selectedBarberId === 'any' ? null : selectedBarberId,
      });

      if (res?.entry?.id) {
        navigate(`/status/${res.entry.id}`);
      }
    } catch (err) {
      if (err.code === 'DUPLICATE_ACTIVE_PHONE' && err.details?.existingEntry) {
        setDuplicateEntry(err.details.existingEntry);
        setSubmitError(err.message);
      } else {
        setSubmitError(err.message || t('common.errorDescription'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitError(null);
    setDuplicateEntry(null);
    setCurrentStep(1);
  };

  const stepLabels = [
    { num: 1, label: t('join.step1Nav') },
    { num: 2, label: t('join.step2Nav') },
    { num: 3, label: t('join.step3Nav') },
    { num: 4, label: t('join.step4Nav') },
  ];

  return (
    <div className="min-h-screen bg-[#171717] text-salon-text flex flex-col selection:bg-salon-gold/30 selection:text-white">
      {/* Sticky Luxury Navbar */}
      <PremiumNavbar currentRoute="join" />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header Breadcrumb & Title */}
          <div className="space-y-3 text-center sm:text-left">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-salon-textMuted hover:text-salon-gold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('join.backToHome')}</span>
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-white tracking-tight break-words">
                  {t('join.pageTitle')}
                </h1>
                <p className="mt-1 text-xs sm:text-base text-salon-textMuted">
                  {t('join.pageSubtitle')}
                </p>
              </div>

              {salon ? (
                <div className="inline-flex items-center gap-2 self-start sm:self-center rounded-xl border border-white/10 bg-[#202020] px-3.5 py-2 text-xs font-medium text-salon-textSecondary tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-salon-gold" />
                  <span>
                    {t('home.openToday', {
                      open: formatTime24To12(salon.openTime),
                      close: formatTime24To12(salon.closeTime),
                    })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {loading && !bootstrap ? (
            <LoadingState message={t('common.loading')} />
          ) : error && !bootstrap ? (
            <ErrorState onRetry={() => refreshBootstrap()} />
          ) : isOnlineJoinClosed ? (
            /* CLOSED-ONLINE-JOINING NOTICE CARD */
            <ScrollReveal>
              <div className="luxury-card-gold rounded-3xl p-8 sm:p-12 text-center space-y-5 border-amber-500/40">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-400">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div className="space-y-2 max-w-xl mx-auto">
                  <h2 className="text-2xl font-bold font-serif text-white">
                    {t('join.closedTitle')}
                  </h2>
                  <p className="text-sm sm:text-base text-salon-textSecondary leading-relaxed">
                    {t('join.closedMessage')}
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/">
                    <Button variant="outline" leftIcon={ArrowLeft}>
                      {t('join.backToHome')}
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ) : (
            <>
              {/* Step Progress Bar */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-4 border-b border-white/10 pb-5">
                {stepLabels.map((s) => {
                  const isActive = currentStep === s.num;
                  const isDone = currentStep > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      disabled={s.num > currentStep}
                      onClick={() => {
                        if (s.num < currentStep) setCurrentStep(s.num);
                      }}
                      className={[
                        'flex items-center justify-center sm:justify-start gap-1.5 sm:gap-3 p-2 sm:p-3 rounded-xl border text-left transition-all min-w-0',
                        isActive
                          ? 'border-salon-gold bg-salon-gold/10 text-salon-gold shadow-goldSubtle'
                          : isDone
                          ? 'border-white/15 bg-white/[0.02] text-salon-textSecondary hover:border-salon-gold/40 cursor-pointer'
                          : 'border-white/5 bg-transparent text-salon-textMuted/40 cursor-not-allowed',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors',
                          isActive
                            ? 'bg-salon-gold text-salon-deep'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-white/50',
                        ].join(' ')}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold truncate hidden sm:inline">
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Multi-Step Workspace (Split Layout with Sticky Summary) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Step Content Form (7 cols on desktop) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* STEP 1: Details */}
                  {currentStep === 1 ? (
                    <ScrollReveal direction="up" initiallyVisible>
                      <div className="luxury-card rounded-3xl p-6 sm:p-8 space-y-6">
                        <div className="border-b border-white/5 pb-4 space-y-1">
                          <h2 className="text-xl font-bold font-serif text-white">
                            {t('join.stepDetails')}
                          </h2>
                          <p className="text-xs text-salon-textMuted">
                            {t('join.stepDetailsSubtitle')}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <Input
                            id="customer-name"
                            label={t('join.nameLabel')}
                            placeholder={t('join.namePlaceholder')}
                            value={customerName}
                            error={errors.name}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                            }}
                            autoComplete="name"
                          />

                          <Input
                            id="customer-phone"
                            label={t('join.phoneLabel')}
                            prefix="+91"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder={t('join.phonePlaceholder')}
                            helperText={t('join.phoneHelper')}
                            value={phone}
                            error={errors.phone}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhone(cleaned);
                              if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                            }}
                            autoComplete="tel-national"
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="primary"
                            size="lg"
                            rightIcon={ArrowRight}
                            onClick={handleNext}
                          >
                            {t('join.btnContinue')}
                          </Button>
                        </div>
                      </div>
                    </ScrollReveal>
                  ) : null}

                  {/* STEP 2: Services Selection */}
                  {currentStep === 2 ? (
                    <ScrollReveal direction="up">
                      <div className="luxury-card rounded-3xl p-6 sm:p-8 space-y-6">
                        <div className="border-b border-white/5 pb-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h2 className="text-xl font-bold font-serif text-white">
                              {t('join.stepServices')}
                            </h2>
                            <p className="text-xs text-salon-textMuted">
                              {t('join.stepServicesSubtitle')}
                            </p>
                          </div>
                          <Badge tone="gold" size="sm">
                            {t('join.selectedCount', { count: selectedServiceIds.length })}
                          </Badge>
                        </div>

                        {selectedServiceIds.length >= 3 ? (
                          <div className="rounded-xl border border-salon-gold/30 bg-salon-gold/10 p-3.5 text-xs text-salon-gold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 shrink-0" />
                            <span>{t('join.maxServicesLimit')}</span>
                          </div>
                        ) : null}

                        {errors.services ? (
                          <p className="text-xs font-semibold text-rose-400" role="alert">
                            {errors.services}
                          </p>
                        ) : null}

                        {/* 6 Services Selection Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {services.map((service) => {
                            const isSelected = selectedServiceIds.includes(service.id);
                            const isMaxReached = selectedServiceIds.length >= 3 && !isSelected;
                            return (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                selectable
                                selected={isSelected}
                                disabled={isMaxReached}
                                onToggle={handleToggleService}
                              />
                            );
                          })}
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-white/5">
                          <Button variant="outline" size="md" leftIcon={ArrowLeft} onClick={handleBack}>
                            {t('join.btnBack')}
                          </Button>
                          <Button
                            variant="primary"
                            size="lg"
                            rightIcon={ArrowRight}
                            onClick={handleNext}
                          >
                            {t('join.btnContinue')}
                          </Button>
                        </div>
                      </div>
                    </ScrollReveal>
                  ) : null}

                  {/* STEP 3: Barber Selection */}
                  {currentStep === 3 ? (
                    <ScrollReveal direction="up">
                      <div className="luxury-card rounded-3xl p-6 sm:p-8 space-y-6">
                        <div className="border-b border-white/5 pb-4 space-y-1">
                          <h2 className="text-xl font-bold font-serif text-white">
                            {t('join.stepBarber')}
                          </h2>
                          <p className="text-xs text-salon-textMuted">
                            {t('join.stepBarberSubtitle')}
                          </p>
                        </div>

                        {/* Any Barber Card (Fastest Available) */}
                        <div
                          onClick={() => setSelectedBarberId(null)}
                          role="radio"
                          aria-checked={selectedBarberId === null}
                          tabIndex={0}
                          className={[
                            'cursor-pointer rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all',
                            selectedBarberId === null
                              ? 'border-salon-gold bg-salon-gold/10 shadow-goldGlow ring-1 ring-salon-gold/50'
                              : 'border-white/10 bg-[#1C1C1C] hover:border-salon-gold/40 hover:bg-[#222222]',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salon-gold/15 border border-salon-gold/30 text-salon-gold shrink-0">
                              <Users className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-white truncate">
                                {t('join.anyBarberTitle')}
                              </h3>
                              <p className="text-xs text-salon-textMuted truncate">
                                {t('join.anyBarberSubtitle')}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge tone={selectedBarberId === null ? 'gold' : 'neutral'}>
                              {selectedBarberId === null ? t('join.selectedLabel') : t('status.barber.AVAILABLE')}
                            </Badge>
                          </div>
                        </div>

                        {/* Individual Barbers Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {barbers.map((barber) => (
                            <BarberCard
                              key={barber.id}
                              barber={barber}
                              selectable
                              selected={selectedBarberId === barber.id}
                              onSelect={() => setSelectedBarberId(barber.id)}
                            />
                          ))}
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-white/5">
                          <Button variant="outline" size="md" leftIcon={ArrowLeft} onClick={handleBack}>
                            {t('join.btnBack')}
                          </Button>
                          <Button
                            variant="primary"
                            size="lg"
                            rightIcon={ArrowRight}
                            onClick={handleNext}
                          >
                            {t('join.btnContinue')}
                          </Button>
                        </div>
                      </div>
                    </ScrollReveal>
                  ) : null}

                  {/* STEP 4: Review Your Selection */}
                  {currentStep === 4 ? (
                    <ScrollReveal direction="up">
                      <div className="luxury-card-gold rounded-3xl p-6 sm:p-8 space-y-6">
                        <div className="border-b border-salon-gold/20 pb-4 flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h2 className="text-xl font-bold font-serif text-white">
                              {t('join.stepReview')}
                            </h2>
                            <p className="text-xs text-salon-textMuted">
                              {t('join.stepReviewSubtitle')}
                            </p>
                          </div>
                          <Badge tone="gold">{t('join.stepReviewBadge')}</Badge>
                        </div>

                        {/* Review Summary Breakdown */}
                        <div className="space-y-4 rounded-2xl bg-black/40 border border-white/5 p-5 text-sm">
                          {/* Customer Details */}
                          <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-salon-textMuted flex items-center gap-2">
                              <User className="h-4 w-4 text-salon-gold" />
                              <span>{t('join.nameLabel')}</span>
                            </span>
                            <span className="font-semibold text-white">{customerName}</span>
                          </div>

                          <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-salon-textMuted">{t('join.phoneLabel')}</span>
                            <span className="font-semibold text-white tabular-nums">
                              +91 {phone}
                            </span>
                          </div>

                          {/* Selected Barber */}
                          <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-salon-textMuted flex items-center gap-2">
                              <Scissors className="h-4 w-4 text-salon-gold" />
                              <span>{t('join.selectedBarber')}</span>
                            </span>
                            <span className="font-semibold text-salon-gold">
                              {selectedBarber ? selectedBarber.name : t('join.anyBarberTitle')}
                            </span>
                          </div>

                          {/* Selected Services Itemized List */}
                          <div className="py-2 space-y-2 border-b border-white/5">
                            <span className="text-salon-textMuted text-xs uppercase tracking-wider block">
                              {t('join.stepServices')} ({selectedServices.length})
                            </span>
                            {selectedServices.map((s) => (
                              <div key={s.id} className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-white">
                                  {getLocalizedName(s.nameEn, s.nameGu)} ({s.durationMinutes} min)
                                </span>
                                <span className="text-salon-gold font-semibold tabular-nums">
                                  {formatInr(s.priceInr)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Totals */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-base font-bold text-white">
                              {t('join.totalPrice')}
                            </span>
                            <span className="text-xl font-extrabold text-salon-gold tabular-nums">
                              {formatInr(totalPrice)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-salon-textMuted">
                            <span>{t('join.totalDuration')}</span>
                            <span className="tabular-nums font-semibold text-salon-textSecondary">
                              ~{totalDuration} mins
                            </span>
                          </div>
                        </div>

                        {/* Real Submission / Error Feedback */}
                        {submitError && (
                          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs space-y-3">
                            <div className="flex items-start gap-2.5 text-red-400">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">{submitError}</p>
                                {duplicateEntry && (
                                  <p className="text-salon-textSecondary">
                                    {t('join.duplicateFoundNotice', { token: duplicateEntry.tokenNumber })}
                                  </p>
                                )}
                              </div>
                            </div>
                            {duplicateEntry && (
                              <div className="pt-1 flex items-center gap-3">
                                <Link to={`/status/${duplicateEntry.id}`}>
                                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                                    {t('join.viewExistingTicket', { token: duplicateEntry.tokenNumber })}
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="md"
                            leftIcon={ArrowLeft}
                            onClick={handleBack}
                            disabled={isSubmitting}
                          >
                            {t('join.btnBack')}
                          </Button>
                          <Button
                            variant="primary"
                            size="lg"
                            rightIcon={isSubmitting ? undefined : CheckCircle2}
                            onClick={handleConfirmReview}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            className="font-bold shadow-goldGlow"
                          >
                            {isSubmitting ? t('join.submitting') : t('join.btnConfirm')}
                          </Button>
                        </div>
                      </div>
                    </ScrollReveal>
                  ) : null}
                </div>

                {/* Right Sticky Booking Summary Drawer (5 cols on desktop) */}
                <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
                  <div className="luxury-card rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-salon-gold" />
                        <span>{t('join.summaryTitle')}</span>
                      </h3>
                      <Badge tone={selectedServiceIds.length > 0 ? 'gold' : 'neutral'} size="sm">
                        {t('join.selectedCount', { count: selectedServiceIds.length })}
                      </Badge>
                    </div>

                    {/* Selected services badge strip */}
                    {selectedServices.length > 0 ? (
                      <div className="space-y-2">
                        {selectedServices.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs"
                          >
                            <span className="font-medium text-white truncate">
                              {getLocalizedName(s.nameEn, s.nameGu)}
                            </span>
                            <span className="text-salon-gold font-bold tabular-nums shrink-0 ml-2">
                              {formatInr(s.priceInr)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-salon-textMuted italic py-2">
                        {t('join.noServicesSelected')}
                      </p>
                    )}

                    {/* Summary Totals */}
                    <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                      <div className="flex items-center justify-between text-salon-textSecondary">
                        <span>{t('join.selectedBarber')}</span>
                        <span className="font-semibold text-salon-gold">
                          {selectedBarber ? selectedBarber.name : t('join.anyBarberTitle')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-salon-textSecondary">
                        <span>{t('join.totalDuration')}</span>
                        <span className="tabular-nums font-semibold text-white">
                          ~{totalDuration} mins
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-sm">
                        <span className="font-bold text-white">{t('join.totalPrice')}</span>
                        <span className="text-xl font-extrabold text-salon-gold tabular-nums">
                          {formatInr(totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Notice helper */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-salon-textMuted space-y-1">
                    <p className="font-semibold text-salon-gold">{t('join.stage2Badge')}</p>
                    <p className="leading-relaxed">{t('join.stage2Description')}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Premium Footer */}
      <PremiumFooter />
    </div>
  );
}
