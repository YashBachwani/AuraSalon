import { Link } from 'react-router-dom';
import { ArrowUp, Clock, Monitor, Scissors, Settings, Sparkles, Users } from 'lucide-react';
import { BrandHeader } from './BrandHeader.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';
import { useConnection } from '../../context/ConnectionContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatTime24To12 } from '../../utils/formatters.js';

export function PremiumFooter() {
  const { bootstrap } = useConnection();
  const { t } = useLanguage();
  const salon = bootstrap?.salon;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const portalLinks = [
    { to: '/reception', label: t('nav.reception'), icon: Users },
    { to: '/barber/ravi', label: t('nav.barber'), icon: Scissors },
    { to: '/display', label: t('nav.display'), icon: Monitor },
    { to: '/admin', label: t('nav.admin'), icon: Settings },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[#0E0E0E] text-salon-text pt-16 pb-12 overflow-hidden">
      {/* Subtle background golden ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-salon-gold/5 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          {/* Brand & Mission (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <BrandHeader subtitle={t('brand.subtitle')} />
            <p className="text-sm text-salon-textMuted max-w-sm leading-relaxed">
              {t('brand.tagline')}
            </p>
            {salon ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-salon-textSecondary tabular-nums">
                <Clock className="h-4 w-4 text-salon-gold shrink-0" aria-hidden="true" />
                <span>
                  {t('home.openToday', {
                    open: formatTime24To12(salon.openTime),
                    close: formatTime24To12(salon.closeTime),
                  })}
                </span>
              </div>
            ) : null}
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-salon-gold">
              {t('nav.quickLinks') || 'Quick Navigation'}
            </h3>
            <ul className="space-y-2 text-sm text-salon-textSecondary">
              <li>
                <a href="#experience" className="hover:text-salon-gold transition-colors">
                  {t('nav.experience') || 'The Experience'}
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-salon-gold transition-colors">
                  {t('nav.services') || 'Services & Pricing'}
                </a>
              </li>
              <li>
                <a href="#barbers" className="hover:text-salon-gold transition-colors">
                  {t('nav.barbers') || 'Master Barbers'}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-salon-gold transition-colors">
                  {t('nav.howItWorks') || 'How Queue Works'}
                </a>
              </li>
              <li>
                <Link to="/join" className="text-salon-gold hover:underline">
                  {t('home.ctaJoin')} →
                </Link>
              </li>
            </ul>
          </div>

          {/* Staff & Display Portals (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-salon-gold">
              {t('nav.staffPortals')}
            </h3>
            <p className="text-xs text-salon-textMuted">
              {t('nav.staffPortalsSubtitle') || 'Internal interfaces for tablet reception, barber chair and waiting-area TV display.'}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {portalLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs font-medium text-salon-textSecondary hover:border-salon-gold/30 hover:text-salon-gold transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-salon-gold shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-salon-textMuted">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Aura Salon. All rights reserved.</span>
            <LanguageToggle />
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-salon-textSecondary hover:text-salon-gold hover:border-salon-gold/40 transition-colors"
          >
            <span>{t('common.backToTop') || 'Back to Top'}</span>
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
