import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const STATE_STYLES = {
  live: {
    container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    dot: 'bg-emerald-400',
    icon: Wifi,
    labelKey: 'connection.live',
  },
  reconnecting: {
    container: 'bg-amber-500/10 border-amber-500/35 text-amber-300',
    dot: 'bg-amber-400 animate-pulse',
    icon: RefreshCw,
    labelKey: 'connection.reconnecting',
  },
  offline: {
    container: 'bg-rose-500/10 border-rose-500/35 text-rose-300',
    dot: 'bg-rose-400',
    icon: WifiOff,
    labelKey: 'connection.offline',
  },
};

export function ConnectionIndicator({ compact = false, className = '' }) {
  const { socketStatus } = useConnection();
  const { t } = useLanguage();
  const cfg = STATE_STYLES[socketStatus] || STATE_STYLES.offline;
  const Icon = cfg.icon;

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap',
        cfg.container,
        className,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {!compact ? (
        <>
          <Icon
            className={`h-3.5 w-3.5 ${socketStatus === 'reconnecting' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{t(cfg.labelKey)}</span>
        </>
      ) : (
        <span className="hidden sm:inline">{t(cfg.labelKey)}</span>
      )}
    </span>
  );
}
