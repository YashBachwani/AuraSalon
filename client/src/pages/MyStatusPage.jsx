import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Ticket } from 'lucide-react';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge, QueueStatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState, LoadingState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export function MyStatusPage() {
  const { id } = useParams();
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();

  const steps = [
    { key: 'WAITING', label: t('myStatus.stepWaiting') },
    { key: 'CALLED', label: t('myStatus.stepCalled') },
    { key: 'IN_CHAIR', label: t('myStatus.stepInChair') },
    { key: 'DONE', label: t('myStatus.stepDone') },
  ];

  return (
    <CustomerLayout showBack backTo="/" maxWidth="max-w-xl">
      {loading && !bootstrap ? (
        <LoadingState message={t('common.loading')} />
      ) : error && !bootstrap ? (
        <ErrorState onRetry={() => refreshBootstrap()} />
      ) : (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Badge tone="gold">{t('myStatus.stage3Badge')}</Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-salon-text">
              {t('myStatus.title')}
            </h1>
            <p className="text-sm text-salon-textMuted">{t('myStatus.subtitle')}</p>
          </div>

          <Card elevated goldAccent>
            <CardContent className="p-6 sm:p-8 text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-salon-border bg-salon-card/70 px-3.5 py-1.5 text-xs font-medium text-salon-textSecondary">
                <Ticket className="h-3.5 w-3.5 text-salon-gold" aria-hidden="true" />
                <span>{t('myStatus.routeIdLabel', { id })}</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-salon-textMuted">
                  {t('myStatus.ticketReference')}
                </p>
                <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-salon-gold tabular-nums">
                  S-—
                </div>
                <div className="pt-1 flex justify-center">
                  <QueueStatusBadge status="WAITING" size="lg" />
                </div>
              </div>

              {/* 4-Step Queue Journey Foundation */}
              <div className="pt-2">
                <p className="text-xs font-medium text-salon-textMuted mb-3">
                  {t('myStatus.progressTitle')}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.key}
                      className="rounded-xl border border-salon-border bg-salon-card/60 px-2 py-2.5 text-center"
                    >
                      <div className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-salon-deep border border-salon-border text-[11px] font-bold text-salon-gold tabular-nums">
                        {index + 1}
                      </div>
                      <span className="block text-[11px] font-medium text-salon-textSecondary truncate">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-salon-gold" aria-hidden="true" />
                <span>{t('common.stageNoticeTitle')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-salon-textSecondary leading-relaxed">
                {t('myStatus.stage3Description')}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t('connection.serverOnline')}</span>
              </div>
              <Link to="/" className="block pt-1">
                <Button variant="outline" fullWidth leftIcon={ArrowLeft}>
                  {t('myStatus.backToHome')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </CustomerLayout>
  );
}
