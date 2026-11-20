import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  KeyRound,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { BrandHeader } from '../components/shared/BrandHeader.jsx';
import { LanguageToggle } from '../components/shared/LanguageToggle.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to appropriate role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') navigate('/customer', { replace: true });
      else if (user.role === 'barber') navigate(`/barber/${user.slug || 'ravi'}`, { replace: true });
      else if (user.role === 'reception') navigate('/reception', { replace: true });
      else if (user.role === 'owner') navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Active role tab: 'customer' | 'barber' | 'reception' | 'owner'
  const [selectedRole, setSelectedRole] = useState('customer');

  // Customer form inputs
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [customerCode, setCustomerCode] = useState('123456');

  // Barber form inputs
  const [barbersList, setBarbersList] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(1);
  const [barberPin, setBarberPin] = useState('1234');

  // Staff & Owner PIN inputs
  const [receptionPin, setReceptionPin] = useState('1234');
  const [ownerPin, setOwnerPin] = useState('5678');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [demoCatalog, setDemoCatalog] = useState(null);

  // Fetch barbers and demo catalog on mount
  useEffect(() => {
    api.getBootstrap().then((res) => {
      if (res?.barbers) {
        setBarbersList(res.barbers.filter((b) => b.isOnDuty));
        if (res.barbers.length > 0) {
          setSelectedBarberId(res.barbers[0].id);
        }
      }
    }).catch(() => {});

    api.getDemoCredentials().then((res) => {
      if (res?.catalog) {
        setDemoCatalog(res.catalog);
      }
    }).catch(() => {});
  }, []);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let payload = { role: selectedRole };
      if (selectedRole === 'customer') {
        payload.phone = customerPhone.replace(/\D/g, '');
        payload.code = customerCode.trim();
      } else if (selectedRole === 'barber') {
        payload.barberId = selectedBarberId;
        payload.pin = barberPin.trim();
      } else if (selectedRole === 'reception') {
        payload.pin = receptionPin.trim();
      } else if (selectedRole === 'owner') {
        payload.pin = ownerPin.trim();
      }

      const loggedUser = await login(payload);

      // Redirect to target or role home
      const fromPath = location.state?.from?.pathname;
      if (fromPath && fromPath !== '/login') {
        navigate(fromPath, { replace: true });
      } else {
        if (loggedUser.role === 'customer') navigate('/customer', { replace: true });
        else if (loggedUser.role === 'barber') navigate(`/barber/${loggedUser.slug || 'ravi'}`, { replace: true });
        else if (loggedUser.role === 'reception') navigate('/reception', { replace: true });
        else if (loggedUser.role === 'owner') navigate('/admin', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick One-Click Demo Fill Helpers
  const fillQuickDemo = (roleKey, extra = {}) => {
    setSelectedRole(roleKey);
    setErrorMessage(null);
    if (roleKey === 'customer') {
      setCustomerPhone(extra.phone || '9876543210');
      setCustomerCode('123456');
    } else if (roleKey === 'barber') {
      if (extra.barberId) setSelectedBarberId(extra.barberId);
      setBarberPin('1234');
    } else if (roleKey === 'reception') {
      setReceptionPin('1234');
    } else if (roleKey === 'owner') {
      setOwnerPin('5678');
    }
  };

  const roleDefinitions = [
    {
      key: 'customer',
      title: t('auth.roleCustomer') || 'Customer',
      desc: t('auth.roleCustomerDesc') || 'Track queue position & tickets',
      icon: User,
    },
    {
      key: 'barber',
      title: t('auth.roleBarber') || 'Barber',
      desc: t('auth.roleBarberDesc') || 'Chair workspace & customer calls',
      icon: Scissors,
    },
    {
      key: 'reception',
      title: t('auth.roleReception') || 'Reception',
      desc: t('auth.roleReceptionDesc') || 'Queue management & walk-ins',
      icon: Users,
    },
    {
      key: 'owner',
      title: t('auth.roleOwner') || 'Salon Owner',
      desc: t('auth.roleOwnerDesc') || 'Settings, catalog & daily analytics',
      icon: Crown,
    },
  ];

  return (
    <div className="min-h-screen bg-[#191817] text-[#F5EFE4] flex flex-col selection:bg-[#C89B45]/30">
      {/* Top Bar */}
      <header className="border-b border-white/5 bg-[#191817]/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <BrandHeader to="/" subtitle="Digital Queue Platform" />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A8A096] hover:text-[#C89B45] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('myStatus.backToHome') || 'Home'}</span>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <Badge tone="gold">{t('auth.demoBadge') || 'Demo Portal Access'}</Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif tracking-tight">
              {t('auth.welcomeTitle') || 'Welcome to Aura Salon'}
            </h1>
            <p className="text-sm sm:text-base text-[#A8A096]">
              {t('auth.welcomeSubtitle') || 'Your salon experience, made simple.'}
            </p>
          </div>

          {/* Role Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {roleDefinitions.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleRoleSelect(role.key)}
                  className={[
                    'p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2',
                    isSelected
                      ? 'border-[#C89B45] bg-[#C89B45]/15 shadow-goldSubtle scale-[1.02]'
                      : 'border-white/5 bg-[#292622]/60 hover:border-white/20 text-[#A8A096] hover:text-white',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-full text-base',
                      isSelected ? 'bg-[#C89B45] text-[#191817]' : 'bg-white/5 text-[#C89B45]',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">{role.title}</span>
                    <span className="text-[10px] text-[#A8A096] leading-tight line-clamp-1">
                      {role.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Form Card */}
          <Card elevated className="border-[#C89B45]/20 bg-[#292622]/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. CUSTOMER LOGIN INPUTS */}
              {selectedRole === 'customer' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#A8A096] mb-1">
                      {t('join.phoneLabel') || 'Mobile Number'}
                    </label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      leftSlot={<Phone className="h-4 w-4 text-[#C89B45]" />}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#A8A096]">
                        {t('auth.demoCodeLabel') || 'Verification Code'}
                      </label>
                      <span className="text-[10px] text-[#C89B45] font-semibold uppercase tracking-wider">
                        DEMO MODE
                      </span>
                    </div>
                    <Input
                      id="customer-code"
                      type="text"
                      value={customerCode}
                      onChange={(e) => setCustomerCode(e.target.value)}
                      placeholder="Enter 123456"
                      maxLength={6}
                      leftSlot={<KeyRound className="h-4 w-4 text-[#C89B45]" />}
                      helperText="Use demo verification code 123456 (no SMS required in demo mode)"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 2. BARBER LOGIN INPUTS */}
              {selectedRole === 'barber' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#A8A096] mb-1">
                      {t('barber.activeBarberLabel') || 'Select Barber Profile'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {barbersList.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBarberId(b.id)}
                          className={[
                            'p-2.5 rounded-xl border text-center transition-colors text-xs font-bold truncate',
                            selectedBarberId === b.id
                              ? 'border-[#C89B45] bg-[#C89B45] text-[#191817]'
                              : 'border-white/10 bg-black/40 text-[#D9D0C2] hover:border-white/20',
                          ].join(' ')}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A8A096] mb-1">
                      {t('auth.barberPinLabel') || 'Barber Security PIN'}
                    </label>
                    <Input
                      id="barber-pin"
                      type="password"
                      value={barberPin}
                      onChange={(e) => setBarberPin(e.target.value)}
                      placeholder="Enter Barber PIN"
                      maxLength={6}
                      leftSlot={<KeyRound className="h-4 w-4 text-[#C89B45]" />}
                      helperText="Demo Barber PIN is 1234"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 3. RECEPTION LOGIN INPUTS */}
              {selectedRole === 'reception' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#A8A096] mb-1">
                      {t('auth.receptionPinLabel') || 'Reception Staff PIN'}
                    </label>
                    <Input
                      id="reception-pin"
                      type="password"
                      value={receptionPin}
                      onChange={(e) => setReceptionPin(e.target.value)}
                      placeholder="Enter Staff PIN"
                      maxLength={6}
                      leftSlot={<KeyRound className="h-4 w-4 text-[#C89B45]" />}
                      helperText="Demo Staff PIN is 1234"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 4. OWNER LOGIN INPUTS */}
              {selectedRole === 'owner' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#A8A096] mb-1">
                      {t('auth.ownerPinLabel') || 'Owner Administrative PIN'}
                    </label>
                    <Input
                      id="owner-pin"
                      type="password"
                      value={ownerPin}
                      onChange={(e) => setOwnerPin(e.target.value)}
                      placeholder="Enter Owner PIN"
                      maxLength={6}
                      leftSlot={<KeyRound className="h-4 w-4 text-[#C89B45]" />}
                      helperText="Demo Owner PIN is 5678"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  rightIcon={ArrowRight}
                  className="font-bold shadow-goldGlow h-12"
                >
                  {isSubmitting
                    ? t('auth.signingIn') || 'Authenticating...'
                    : `${t('auth.signInAs') || 'Sign In as'} ${
                        roleDefinitions.find((r) => r.key === selectedRole)?.title || 'User'
                      }`}
                </Button>
              </div>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#C89B45]" />
                  <span>{t('auth.quickDemoTitle') || 'One-Click Demo Access'}</span>
                </span>
                <span className="text-[11px] text-[#A8A096]">Click role to autofill</span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('customer', { phone: '9876543210' })}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/40 text-[#D9D0C2] hover:border-[#C89B45] hover:text-[#C89B45] transition-colors"
                >
                  👤 Customer
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('barber', { barberId: 1 })}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/40 text-[#D9D0C2] hover:border-[#C89B45] hover:text-[#C89B45] transition-colors"
                >
                  ✂️ Ravi (Barber)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('barber', { barberId: 2 })}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/40 text-[#D9D0C2] hover:border-[#C89B45] hover:text-[#C89B45] transition-colors"
                >
                  ✂️ Amit (Barber)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('reception')}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/40 text-[#D9D0C2] hover:border-[#C89B45] hover:text-[#C89B45] transition-colors"
                >
                  📋 Reception
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('owner')}
                  className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/40 text-[#D9D0C2] hover:border-[#C89B45] hover:text-[#C89B45] transition-colors"
                >
                  👑 Owner
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
