import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Clock, Home, LogIn, LogOut, Monitor, Scissors, Settings, Users, User, Crown } from 'lucide-react';
import { BrandHeader } from '../components/shared/BrandHeader.jsx';
import { ConnectionIndicator } from '../components/shared/ConnectionIndicator.jsx';
import { LanguageToggle } from '../components/shared/LanguageToggle.jsx';
import { useClock } from '../hooks/useClock.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function StaffLayout({ children, subtitle, maxWidth = 'max-w-7xl' }) {
  const { t } = useLanguage();
  const { timeFormatted, dateFormatted } = useClock();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build role-tailored navigation items
  const navItems = (() => {
    const items = [{ to: '/', label: t('nav.home'), icon: Home, end: true }];

    if (user?.role === 'barber') {
      items.push({
        to: `/barber/${user.slug || 'ravi'}`,
        label: `${user.name || t('nav.barber')}'s Chair`,
        icon: Scissors,
        end: false,
      });
      items.push({ to: '/display', label: t('nav.display'), icon: Monitor, end: false });
    } else if (user?.role === 'reception') {
      items.push({ to: '/reception', label: t('nav.reception'), icon: Users, end: false });
      items.push({ to: '/display', label: t('nav.display'), icon: Monitor, end: false });
    } else if (user?.role === 'owner') {
      items.push({ to: '/admin', label: t('nav.admin'), icon: Settings, end: false });
      items.push({ to: '/reception', label: t('nav.reception'), icon: Users, end: false });
      items.push({ to: '/barber/ravi', label: t('nav.barber'), icon: Scissors, end: false });
      items.push({ to: '/display', label: t('nav.display'), icon: Monitor, end: false });
    } else {
      // Default fallback
      items.push({ to: '/reception', label: t('nav.reception'), icon: Users, end: false });
      items.push({ to: '/barber/ravi', label: t('nav.barber'), icon: Scissors, end: false });
      items.push({ to: '/display', label: t('nav.display'), icon: Monitor, end: false });
      items.push({ to: '/admin', label: t('nav.admin'), icon: Settings, end: false });
    }

    return items;
  })();

  const getRoleIcon = () => {
    if (user?.role === 'owner') return Crown;
    if (user?.role === 'reception') return Users;
    if (user?.role === 'barber') return Scissors;
    return User;
  };
  const RoleIcon = getRoleIcon();

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

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-white/10">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-salon-gold/30 bg-salon-goldMuted text-xs font-semibold text-salon-gold">
                  <RoleIcon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[100px]">{user.name || user.role}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-salon-textSecondary hover:text-white hover:border-white/20 transition-colors"
                  title={t('nav.logout') || 'Logout'}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{t('nav.logout') || 'Logout'}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg border border-salon-gold/40 bg-salon-goldMuted text-xs font-semibold text-salon-gold hover:border-salon-gold transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t('nav.signIn') || 'Sign In'}</span>
              </Link>
            )}
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
