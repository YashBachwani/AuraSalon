import { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { BrandHeader } from '../components/shared/BrandHeader.jsx';
import { ConnectionIndicator } from '../components/shared/ConnectionIndicator.jsx';
import { LanguageToggle } from '../components/shared/LanguageToggle.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useClock } from '../hooks/useClock.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export function DisplayLayout({ children }) {
  const { t } = useLanguage();
  const { timeFormatted, dateFormatted } = useClock();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen may be restricted by browser policies
    }
  }, []);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-salon-deep text-salon-text flex flex-col">
      <header className="shrink-0 border-b border-salon-border bg-salon-bg/95 px-5 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
        <BrandHeader size="tv" subtitle={t('display.title')} />

        <div className="flex items-center gap-3 lg:gap-5">
          <Badge tone="emerald" dot size="lg" className="hidden md:inline-flex">
            {t('status.salon.open')}
          </Badge>

          <div className="text-right tabular-nums">
            <div className="text-xl lg:text-3xl font-extrabold tracking-tight text-salon-gold leading-none">
              {timeFormatted}
            </div>
            <div className="mt-1 text-xs lg:text-sm font-medium text-salon-textSecondary">
              {dateFormatted}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionIndicator compact />
            <LanguageToggle />
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-salon-border bg-salon-deep text-salon-textSecondary hover:text-salon-gold hover:border-salon-gold/50 transition-colors"
              aria-label={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}
              title={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-5 lg:px-10 py-5 lg:py-6 flex flex-col gap-5 lg:gap-6">
        {children}
      </main>
    </div>
  );
}
