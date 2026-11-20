import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X, Sparkles, Scissors, Clock, Info, ShieldCheck } from 'lucide-react';
import { BrandHeader } from './BrandHeader.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';
import { ConnectionIndicator } from './ConnectionIndicator.jsx';
import { Button } from '../ui/Button.jsx';
import { useScrollPosition } from '../../hooks/useScrollPosition.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function PremiumNavbar({ currentRoute = 'home' }) {
  const { isScrolled } = useScrollPosition(40);
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  const navLinks = [
    { href: '/#experience', label: t('nav.experience') || 'Experience', isAnchor: true },
    { href: '/#services', label: t('nav.services') || 'Services', isAnchor: true },
    { href: '/#barbers', label: t('nav.barbers') || 'Barbers', isAnchor: true },
    { href: '/#how-it-works', label: t('nav.howItWorks') || 'How It Works', isAnchor: true },
  ];

  const handleAnchorClick = (e, href) => {
    if (isHomePage && href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        isScrolled
          ? 'glass-nav-scrolled py-3'
          : 'glass-nav-top py-4 sm:py-5',
      ].join(' ')}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <BrandHeader to="/" subtitle={t('brand.subtitle')} />
        </div>

        {/* Desktop Nav Links */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2 rounded-full border border-white/5 bg-black/20 px-4 py-1.5 backdrop-blur-md"
          aria-label="Main Navigation"
        >
          <Link
            to="/"
            className={[
              'px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-colors',
              isHomePage
                ? 'text-salon-gold font-semibold'
                : 'text-salon-textSecondary hover:text-salon-text',
            ].join(' ')}
          >
            {t('nav.home')}
          </Link>

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-salon-textSecondary hover:text-salon-text transition-colors rounded-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA & Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <ConnectionIndicator compact />
          <LanguageToggle />

          {currentRoute !== 'join' ? (
            <Link to="/join">
              <Button
                variant="primary"
                size="md"
                rightIcon={ArrowRight}
                className="shadow-goldGlow hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('home.ctaJoin')}
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant="outline" size="md">
                {t('nav.home')}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/10 bg-white/5 text-salon-text hover:text-salon-gold focus:outline-none"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen ? (
        <div className="sm:hidden border-b border-white/10 bg-[#141414]/98 backdrop-blur-2xl px-5 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-base font-semibold text-salon-text hover:text-salon-gold border-b border-white/5"
            >
              <span>{t('nav.home')}</span>
            </Link>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="flex items-center justify-between py-2 text-base font-medium text-salon-textSecondary hover:text-salon-gold border-b border-white/5"
              >
                <span>{link.label}</span>
              </a>
            ))}

            <Link
              to="/reception"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-sm text-salon-textMuted hover:text-salon-gold"
            >
              <span>{t('nav.reception')}</span>
            </Link>
            <Link
              to="/display"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-sm text-salon-textMuted hover:text-salon-gold"
            >
              <span>{t('nav.display')}</span>
            </Link>
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <Link to="/join" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" fullWidth rightIcon={ArrowRight}>
                {t('home.ctaJoin')}
              </Button>
            </Link>
            <div className="flex justify-center pt-1">
              <ConnectionIndicator />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

