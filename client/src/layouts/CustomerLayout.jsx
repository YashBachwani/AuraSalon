import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft, Monitor, Scissors, Settings, Users } from 'lucide-react';
import { BrandHeader } from '../components/shared/BrandHeader.jsx';
import { ConnectionIndicator } from '../components/shared/ConnectionIndicator.jsx';
import { LanguageToggle } from '../components/shared/LanguageToggle.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export function CustomerLayout({
  children,
  showBack = false,
  backTo = '/',
  maxWidth = 'max-w-4xl',
}) {
  const { t } = useLanguage();

  const staffLinks = [
    { to: '/reception', label: t('nav.reception'), icon: Users },
    { to: '/barber/ravi', label: t('nav.barber'), icon: Scissors },
    { to: '/display', label: t('nav.display'), icon: Monitor },
    { to: '/admin', label: t('nav.admin'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-salon-bg text-salon-text flex flex-col">
      <header className="sticky top-0 z-30 border-b border-salon-border bg-salon-deep/95 backdrop-blur-sm">
        <div className={`mx-auto ${maxWidth} px-4 sm:px-6 h-16 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            {showBack ? (
              <Link
                to={backTo}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-salon-border bg-salon-card/80 text-salon-textSecondary hover:text-salon-text hover:border-salon-gold/50 transition-colors"
                aria-label={t('nav.back')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : null}
            <BrandHeader subtitle={t('brand.subtitle')} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ConnectionIndicator compact />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full mx-auto ${maxWidth} px-4 sm:px-6 py-6 sm:py-8`}>
        {children}
      </main>

      <footer className="border-t border-salon-border/80 bg-salon-deep/70">
        <div className={`mx-auto ${maxWidth} px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <span className="text-xs font-medium text-salon-textMuted">{t('nav.staffPortals')}</span>
          <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={t('nav.staffPortals')}>
            {staffLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg border border-salon-border/80 bg-salon-card/60 text-xs font-medium text-salon-textSecondary hover:text-salon-gold hover:border-salon-gold/40 transition-colors"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
