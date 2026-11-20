import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';

export function LoadingState({ message, compact = false, className = '' }) {
  const { t } = useLanguage();
  return (
    <Card
      elevated
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'p-6' : 'p-10'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salon-goldMuted border border-salon-gold/30 mb-4">
        <Loader2 className="h-6 w-6 text-salon-gold animate-spin" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-salon-textSecondary">
        {message || t('states.loadingDefault')}
      </p>
      <div className="mt-5 w-full max-w-xs space-y-2.5">
        <div className="h-2.5 rounded-full bg-salon-card animate-pulse" />
        <div className="h-2.5 w-3/4 mx-auto rounded-full bg-salon-card animate-pulse" />
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action = null,
  compact = false,
  className = '',
}) {
  const { t } = useLanguage();
  return (
    <Card
      elevated
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'p-6' : 'p-10'
      } ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salon-card border border-salon-border mb-4">
        <Icon className="h-6 w-6 text-salon-gold" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-salon-text">
        {title || t('states.emptyDefaultTitle')}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-salon-textMuted">
        {description || t('states.emptyDefaultDescription')}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  onRetry = null,
  compact = false,
  className = '',
}) {
  const { t } = useLanguage();
  return (
    <Card
      elevated
      className={`flex flex-col items-center justify-center text-center border-rose-500/40 ${
        compact ? 'p-6' : 'p-10'
      } ${className}`}
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/35 mb-4">
        <AlertTriangle className="h-6 w-6 text-rose-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-salon-text">
        {title || t('states.errorDefaultTitle')}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-salon-textMuted">
        {description || t('states.errorDefaultDescription')}
      </p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="primary" leftIcon={RefreshCw} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
