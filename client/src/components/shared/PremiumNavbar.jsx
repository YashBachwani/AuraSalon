import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Menu,
  X,
  Scissors,
  Clock,
  Sparkles,
  Ticket,
  LogIn,
  LogOut,
  User,
  Users,
  Crown,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { BrandHeader } from './BrandHeader.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';
import { ConnectionIndicator } from './ConnectionIndicator.jsx';
import { Button } from '../ui/Button.jsx';
import { useScrollPosition } from '../../hooks/useScrollPosition.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function PremiumNavbar({ currentRoute = 'home' }) {
  const { isScrolled } = useScrollPosition(30);
  const { t } = useLanguage();
  const { user, isAuthenticated, activeTicket, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on navigation or hash changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'customer') return '/customer';
    if (user.role === 'barber') return `/barber/${user.slug || 'ravi'}`;
    if (user.role === 'reception') return '/reception';
    if (user.role === 'owner') return '/admin';
    return '/';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'customer') {
      return {
        label: user.name || user.phone || t('auth.roleCustomer'),
        icon: User,
        color: 'text-salon-gold',
        border: 'border-salon-gold/30',
        bg: 'bg-salon-gold/10',
      };
    }
    if (user.role === 'barber') {
      return {
        label: user.name || t('auth.roleBarber'),
        icon: Scissors,
        color: 'text-salon-gold',
        border: 'border-salon-gold/30',
        bg: 'bg-salon-gold/10',
      };
    }
    if (user.role === 'reception') {
      return {
        label: t('auth.roleReception'),
        icon: Users,
        color: 'text-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10',
      };
    }
    if (user.role === 'owner') {
      return {
        label: t('auth.roleOwner'),
        icon: Crown,
        color: 'text-amber-400',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
      };
    }
    return {
      label: 'User',
      icon: User,
      color: 'text-salon-gold',
      border: 'border-white/10',
      bg: 'bg-white/5',
    };
  };

  const roleInfo = getRoleBadge();

  const navLinks = [
    { href: '/#experience', label: t('nav.experience') || 'Experience' },
    { href: '/#services', label: t('nav.services') || 'Services' },
    { href: '/#barbers', label: t('nav.barbers') || 'Barbers' },
    { href: '/#how-it-works', label: t('nav.howItWorks') || 'How It Works' },
  ];

  const handleHomeClick = (e) => {
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleAnchorClick = (e, href) => {
    const targetId = href.replace('/#', '').replace('#', '');
    if (isHomePage) {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        const navHeight = 84;
        const targetPosition = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth',
        });
        window.history.pushState(null, '', href);
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isScrolled
            ? 'glass-nav-scrolled py-3'
            : 'glass-nav-top py-4 sm:py-5',
        ].join(' ')}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <BrandHeader to="/" subtitle={t('brand.subtitle')} />
          </div>

          {/* Desktop Navigation Links (Pill Capsule) */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 backdrop-blur-md shadow-inner"
            aria-label={t('nav.quickLinks') || 'Main Navigation'}
          >
            <Link
              to="/"
              onClick={handleHomeClick}
              className={[
                'px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-full transition-colors',
                isHomePage
                  ? 'text-salon-gold font-semibold bg-white/5'
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
                className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-salon-textSecondary hover:text-salon-gold transition-colors rounded-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Controls & Role-Tailored CTA (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5 lg:gap-3">
            <ConnectionIndicator compact />
            <LanguageToggle />

            {/* Authenticated Controls */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* Customer: Active ticket quick jump or Profile pill */}
                {user.role === 'customer' && (
                  <>
                    {activeTicket ? (
                      <Link to={`/status/${activeTicket.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={Ticket}
                          className="border-salon-gold/40 text-salon-gold bg-salon-gold/10 hover:bg-salon-gold/20 text-xs font-bold"
                          title={t('nav.status')}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>#{activeTicket.token_number}</span>
                          </span>
                        </Button>
                      </Link>
                    ) : null}

                    <Link
                      to="/customer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-salon-gold/30 bg-salon-goldMuted text-xs font-semibold text-salon-gold hover:border-salon-gold transition-colors"
                      title={t('nav.myAccount') || 'My Profile'}
                    >
                      <User className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[110px]">{user.name || user.phone || 'Profile'}</span>
                    </Link>

                    {currentRoute !== 'join' && !activeTicket ? (
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
                    ) : null}
                  </>
                )}

                {/* Barber Role: "My Chair" dedicated CTA + Badge */}
                {user.role === 'barber' && (
                  <>
                    <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-salon-gold/20 bg-salon-gold/5 text-xs text-salon-textSecondary">
                      <Scissors className="h-3.5 w-3.5 text-salon-gold" />
                      <span className="truncate max-w-[100px]">{user.name || 'Barber'}</span>
                    </span>
                    <Link to={`/barber/${user.slug || 'ravi'}`}>
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={Scissors}
                        className="shadow-goldGlow hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('nav.myChair') || 'My Chair'}
                      </Button>
                    </Link>
                  </>
                )}

                {/* Reception Role: "Reception Desk" dedicated CTA + Badge */}
                {user.role === 'reception' && (
                  <>
                    <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300">
                      <Users className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{t('auth.roleReception')}</span>
                    </span>
                    <Link to="/reception">
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={Users}
                        className="shadow-goldGlow hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('nav.receptionDesk') || 'Reception Desk'}
                      </Button>
                    </Link>
                  </>
                )}

                {/* Owner Role: "Owner Dashboard" dedicated CTA + Badge */}
                {user.role === 'owner' && (
                  <>
                    <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300">
                      <Crown className="h-3.5 w-3.5 text-salon-gold" />
                      <span>{t('auth.roleOwner')}</span>
                    </span>
                    <Link to="/admin">
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={Crown}
                        className="shadow-goldGlow hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('nav.ownerDashboard') || 'Owner Dashboard'}
                      </Button>
                    </Link>
                  </>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-full border border-white/10 bg-white/5 text-salon-textSecondary hover:text-white hover:border-white/25 transition-colors focus:outline-none"
                  title={t('nav.logout') || 'Logout'}
                  aria-label={t('nav.logout') || 'Logout'}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Unauthenticated / Guest View */
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={LogIn}
                    className="text-xs text-salon-textSecondary hover:text-salon-gold"
                  >
                    {t('nav.signIn') || 'Sign In'}
                  </Button>
                </Link>

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
            )}
          </div>

          {/* Mobile Right Controls: Language & Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/10 bg-white/5 text-salon-text hover:text-salon-gold focus:outline-none transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('nav.closeMenu') || 'Close Menu' : t('nav.menu') || 'Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 sm:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Mobile Drawer Panel (Slide-in from Right) */}
      <aside
        id="mobile-navigation-drawer"
        aria-label={t('nav.menu') || 'Mobile Menu'}
        className={[
          'fixed top-0 right-0 bottom-0 w-[86%] max-w-[340px] bg-[#141414] border-l border-white/10 shadow-2xl z-50 sm:hidden flex flex-col justify-between transition-transform duration-300 ease-out',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <BrandHeader to="/" subtitle={t('brand.subtitle')} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/10 bg-white/5 text-salon-textSecondary hover:text-white focus:outline-none"
              aria-label={t('nav.closeMenu') || 'Close Menu'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Status / Auth Card in Mobile Drawer */}
          {isAuthenticated && user ? (
            <div className={`p-3.5 rounded-2xl border ${roleInfo?.border} ${roleInfo?.bg} space-y-2.5`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {roleInfo && <roleInfo.icon className={`h-4 w-4 ${roleInfo.color} shrink-0`} />}
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-salon-text truncate">
                      {roleInfo?.label}
                    </span>
                    <span className={`block text-[10px] uppercase font-semibold ${roleInfo?.color}`}>
                      {t(`auth.role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-salon-textSecondary hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('nav.logout') || 'Logout'}</span>
                </button>
              </div>

              {/* If customer has active ticket, display active badge */}
              {user.role === 'customer' && activeTicket && (
                <Link
                  to={`/status/${activeTicket.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl bg-salon-gold/10 border border-salon-gold/30 text-xs font-semibold text-salon-gold"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{t('nav.myQueue') || 'My Ticket'}: #{activeTicket.token_number}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between min-h-[44px] p-3.5 rounded-2xl border border-salon-gold/30 bg-salon-gold/10 hover:border-salon-gold text-sm font-semibold text-salon-gold transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <LogIn className="h-4 w-4" />
                <span>{t('nav.signIn') || 'Sign In / Demo Login'}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-salon-gold" />
            </Link>
          )}

          {/* Primary Nav Links */}
          <nav className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={handleHomeClick}
              className="flex items-center justify-between min-h-[44px] px-3 py-2 text-sm font-semibold text-salon-text hover:text-salon-gold rounded-xl hover:bg-white/5 transition-colors"
            >
              <span>{t('nav.home')}</span>
            </Link>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="flex items-center justify-between min-h-[44px] px-3 py-2 text-sm font-medium text-salon-textSecondary hover:text-salon-gold rounded-xl hover:bg-white/5 transition-colors"
              >
                <span>{link.label}</span>
              </a>
            ))}
          </nav>

          {/* Quick Staff & Display Portals */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-salon-textMuted">
              {t('nav.staffPortals') || 'Portals & Views'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/reception"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] p-2.5 rounded-xl border border-white/5 bg-[#1C1C1C] hover:border-salon-gold/30 text-xs text-salon-textSecondary hover:text-white"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{t('nav.reception')}</span>
              </Link>

              <Link
                to="/barber/ravi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] p-2.5 rounded-xl border border-white/5 bg-[#1C1C1C] hover:border-salon-gold/30 text-xs text-salon-textSecondary hover:text-white"
              >
                <Scissors className="h-3.5 w-3.5 text-salon-gold shrink-0" />
                <span className="truncate">{t('nav.barber')}</span>
              </Link>

              <Link
                to="/display"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] p-2.5 rounded-xl border border-white/5 bg-[#1C1C1C] hover:border-salon-gold/30 text-xs text-salon-textSecondary hover:text-white"
              >
                <Monitor className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{t('nav.display')}</span>
              </Link>

              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 min-h-[44px] p-2.5 rounded-xl border border-white/5 bg-[#1C1C1C] hover:border-salon-gold/30 text-xs text-salon-textSecondary hover:text-white"
              >
                <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{t('nav.admin')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Bottom Section (Action CTA + Connection) */}
        <div className="p-5 border-t border-white/10 bg-[#121212] space-y-3">
          {/* Role-tailored Mobile CTA button */}
          {isAuthenticated && user ? (
            <>
              {user.role === 'customer' && (
                <Link
                  to={activeTicket ? `/status/${activeTicket.id}` : '/join'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="lg" fullWidth rightIcon={ArrowRight}>
                    {activeTicket
                      ? `${t('nav.myQueue') || 'My Ticket'}: #${activeTicket.token_number}`
                      : t('home.ctaJoin')}
                  </Button>
                </Link>
              )}

              {user.role === 'barber' && (
                <Link
                  to={`/barber/${user.slug || 'ravi'}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="lg" fullWidth leftIcon={Scissors}>
                    {t('nav.myChair') || 'Open My Chair'}
                  </Button>
                </Link>
              )}

              {user.role === 'reception' && (
                <Link to="/reception" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="primary" size="lg" fullWidth leftIcon={Users}>
                    {t('nav.receptionDesk') || 'Open Reception Desk'}
                  </Button>
                </Link>
              )}

              {user.role === 'owner' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="primary" size="lg" fullWidth leftIcon={Crown}>
                    {t('nav.ownerDashboard') || 'Open Owner Dashboard'}
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Link to="/join" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="primary" size="lg" fullWidth rightIcon={ArrowRight}>
                {t('home.ctaJoin')}
              </Button>
            </Link>
          )}

          <div className="flex items-center justify-between text-xs text-salon-textMuted pt-1">
            <ConnectionIndicator compact />
            <span className="text-[11px] tabular-nums">Aura Salon &bull; Live Queue</span>
          </div>
        </div>
      </aside>
    </>
  );
}
