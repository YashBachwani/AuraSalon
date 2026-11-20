import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Scissors, Sparkles, UserCheck } from 'lucide-react';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge, BarberAvailabilityBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getInitials } from '../utils/formatters.js';

export function JoinQueuePage() {
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();

  // Controlled inputs verify state retention across EN / ગુજરાતી switches
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');

  const barbers = (bootstrap?.barbers || []).filter((b) => b.isOnDuty);

  return (
    <CustomerLayout showBack backTo="/" maxWidth="max-w-5xl">
      {loading && !bootstrap ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !bootstrap ? (
        <ErrorState onRetry={() => refreshBootstrap()} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-salon-text">
                {t('join.title')}
              </h1>
              <p className="mt-1 text-sm text-salon-textMuted">{t('join.subtitle')}</p>
            </div>
            <Badge tone="gold">{t('join.stage2Badge')}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form Structure (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-5">
              <Card elevated>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCheck className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                    <span>{t('join.stepDetails')}</span>
                  </CardTitle>
                  <CardDescription>{t('home.languageRetentionNote')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="join-customer-name"
                    label={t('join.nameLabel')}
                    placeholder={t('join.namePlaceholder')}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="name"
                  />
                  <Input
                    id="join-phone"
                    label={t('join.phoneLabel')}
                    prefix="+91"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={t('join.phonePlaceholder')}
                    helperText={t('join.phoneHelper')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoComplete="tel-national"
                  />
                </CardContent>
              </Card>

              <Card elevated>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                      <span>{t('join.stepServices')}</span>
                    </CardTitle>
                    <Badge tone="neutral">
                      {t('common.activeServicesCount', { count: bootstrap?.counts?.activeServices ?? 0 })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-salon-textSecondary leading-relaxed">
                    {t('join.stage2Description')}
                  </p>
                </CardContent>
              </Card>

              <Card elevated>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Scissors className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                    <span>{t('join.stepBarber')}</span>
                  </CardTitle>
                  <CardDescription>{t('join.barberNote')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="rounded-xl border border-salon-border bg-salon-card/70 p-3.5 flex items-center gap-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-salon-deep shrink-0"
                        style={{ backgroundColor: barber.avatarColor || '#D4A017' }}
                      >
                        {getInitials(barber.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-salon-text truncate">{barber.name}</p>
                        <div className="mt-1">
                          <BarberAvailabilityBadge availability={barber.availability} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Sticky Summary Shell (4 cols on desktop) */}
            <Card elevated goldAccent className="lg:col-span-4 lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-base">{t('join.summaryTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-salon-gold/30 bg-salon-goldMuted p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-salon-gold shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs sm:text-sm text-salon-textSecondary leading-relaxed">
                    {t('join.stage2Description')}
                  </p>
                </div>

                <Link to="/" className="block">
                  <Button variant="outline" fullWidth leftIcon={ArrowLeft}>
                    {t('join.backToHome')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
