import { NavLink } from 'react-router-dom';
import { Clock, Home, Monitor, Scissors, Settings, Users } from 'lucide-react';
import { BrandHeader } from '../components/shared/BrandHeader.jsx';
import { ConnectionIndicator } from '../components/shared/ConnectionIndicator.jsx';
import { LanguageToggle } from '../components/shared/LanguageToggle.jsx';
import { useClock } from '../hooks/useClock.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export function StaffLayout({ children, subtitle, maxWidth = 'max-w-7xl' }) {
  const { t } = useLanguage();
  const { timeFormatted, dateFormatted } = useClock();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/reception', label: t('nav.reception'), icon: Users, end: false },
    { to: '/barber/ravi', label: t('nav.barber'), icon: Scissors, end: false },
    { to: '/display', label: t('nav.display'), icon: Monitor, end: false },
    { to: '/admin', label: t('nav.admin'), icon: Settings, end: false },
  ];

  return (
    <div className="min-h-screen bg-salon-bg text-salon-text flex flex-col">
      <header className="sticky top-0 z-30 border-b border-salon-border bg-salon-deep/95 backdrop-blur-sm">
        <div className={`mx-auto ${maxWidth} px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-4 min-w-0">
            <BrandHeader subtitle={subtitle} />
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-salon-border bg-salon-card/70 px-3 py-1.5 text-xs font-medium text-salon-textSecondary tabular-nums">
              <Clock className="h-3.5 w-3.5 text-salon-gold" aria-hidden="true" />
              <span>{dateFormatted}</span>
              <span className="text-salon-border">•</span>
              <span className="text-salon-text font-semibold">{timeFormatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ConnectionIndicator compact />
            <LanguageToggle />
          </div>
        </div>

        <nav
          className="border-t border-salon-border/70 bg-salon-deep/80 overflow-x-auto"
          aria-label={t('nav.staffPortals')}
        >
          <div className={`mx-auto ${maxWidth} px-4 sm:px-6 py-2 flex items-center gap-1.5`}>
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors border',
                    isActive
                      ? 'bg-salon-goldMuted text-salon-gold border-salon-gold/40'
                      : 'text-salon-textSecondary border-transparent hover:text-salon-text hover:bg-salon-card/70',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className={`flex-1 w-full mx-auto ${maxWidth} px-4 sm:px-6 py-5 sm:py-6`}>
        {children}
      </main>
    </div>
  );
}
