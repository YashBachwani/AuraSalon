import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  HeartHandshake,
  Scissors,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { PremiumNavbar } from '../components/shared/PremiumNavbar.jsx';
import { PremiumFooter } from '../components/shared/PremiumFooter.jsx';
import { SectionHeading } from '../components/ui/SectionHeading.jsx';
import { ServiceCard } from '../components/ui/ServiceCard.jsx';
import { BarberCard } from '../components/ui/BarberCard.jsx';
import { QueuePreviewCard } from '../components/ui/QueuePreviewCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ScrollReveal } from '../components/ui/ScrollReveal.jsx';
import { ImageReveal } from '../components/ui/ImageReveal.jsx';
import { LoadingState, ErrorState } from '../components/ui/StateViews.jsx';
import { useConnection } from '../context/ConnectionContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatTime24To12 } from '../utils/formatters.js';
import { SALON_IMAGES } from '../utils/salonImages.js';

export function HomePage() {
  const { bootstrap, loading, error, refreshBootstrap } = useConnection();
  const { t } = useLanguage();

  const salon = bootstrap?.salon;
  const services = bootstrap?.services || [];
  const barbers = (bootstrap?.barbers || []).filter((b) => b.isOnDuty);

  const pillars = [
    {
      icon: Crown,
      title: t('home.experiencePillar1Title'),
      desc: t('home.experiencePillar1Desc'),
    },
    {
      icon: Ticket,
      title: t('home.experiencePillar2Title'),
      desc: t('home.experiencePillar2Desc'),
    },
    {
      icon: Sparkles,
      title: t('home.experiencePillar3Title'),
      desc: t('home.experiencePillar3Desc'),
    },
  ];

  const steps = [
    {
      num: t('home.step1Number'),
      title: t('home.step1Title'),
      desc: t('home.step1Desc'),
      icon: Scissors,
    },
    {
      num: t('home.step2Number'),
      title: t('home.step2Title'),
      desc: t('home.step2Desc'),
      icon: Ticket,
    },
    {
      num: t('home.step3Number'),
      title: t('home.step3Title'),
      desc: t('home.step3Desc'),
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-[#171717] text-salon-text flex flex-col selection:bg-salon-gold/30 selection:text-white">
      {/* SECTION 1: Sticky Premium Navigation */}
      <PremiumNavbar currentRoute="home" />

      {loading && !bootstrap ? (
        <div className="flex-1 flex items-center justify-center p-8 pt-32">
          <LoadingState message={t('common.loading')} />
        </div>
      ) : error && !bootstrap ? (
        <div className="flex-1 flex items-center justify-center p-8 pt-32">
          <ErrorState onRetry={() => refreshBootstrap()} />
        </div>
      ) : (
        <main className="flex-1">
          {/* SECTION 2: Cinematic Luxury Hero */}
          <section
            id="hero"
            aria-label="Hero"
            className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24"
          >
            {/* Background Photographic Atmosphere with Dark Gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src={SALON_IMAGES.hero}
                alt="Aura Salon Luxury Styling Atmosphere"
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
                priority="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/85 to-[#171717]/70 backdrop-blur-[2px]"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-radial-gradient from-transparent via-[#171717]/60 to-[#171717]"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-3xl space-y-6 sm:space-y-8">
                {/* Brand Eyebrow & Live Operating Status */}
                <ScrollReveal delay={50} initiallyVisible>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-salon-gold/40 bg-salon-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-salon-gold shadow-goldSubtle backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-salon-gold" />
                      <span>{t('home.heroEyebrow')}</span>
                    </div>

                    {salon ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-salon-textSecondary backdrop-blur-md tabular-nums">
                        <Clock className="h-3.5 w-3.5 text-salon-gold" aria-hidden="true" />
                        <span>
                          {t('home.openToday', {
                            open: formatTime24To12(salon.openTime),
                            close: formatTime24To12(salon.closeTime),
                          })}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </ScrollReveal>

                {/* Editorial Master Headline */}
                <ScrollReveal delay={150} initiallyVisible>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-serif leading-[1.08]">
                    <span className="block">{t('home.heroHeadlinePrimary')}</span>
                    <span className="block text-gold-gradient mt-1">
                      {t('home.heroHeadlineSecondary')}
                    </span>
                  </h1>
                </ScrollReveal>

                {/* Supporting Description */}
                <ScrollReveal delay={250} initiallyVisible>
                  <p className="text-base sm:text-xl text-salon-textSecondary/90 max-w-2xl leading-relaxed font-sans">
                    {t('home.heroSubtitle')}
                  </p>
                </ScrollReveal>

                {/* Action CTAs */}
                <ScrollReveal delay={350} initiallyVisible>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                    <Link to="/join">
                      <Button
                        variant="primary"
                        size="xl"
                        fullWidth
                        rightIcon={ArrowRight}
                        className="shadow-goldGlow hover:scale-[1.02] active:scale-[0.98] font-bold"
                      >
                        {t('home.ctaJoin')}
                      </Button>
                    </Link>

                    <a href="#services">
                      <Button
                        variant="outline"
                        size="xl"
                        fullWidth
                        leftIcon={Scissors}
                        className="border-white/20 bg-white/[0.03] hover:border-salon-gold/50 hover:bg-white/[0.08]"
                      >
                        {t('home.heroExploreServices')}
                      </Button>
                    </a>
                  </div>
                </ScrollReveal>

                {/* Real-time Barber & Service Stats Strip */}
                <ScrollReveal delay={450} initiallyVisible>
                  <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-salon-textMuted font-medium">
                        {t('home.configuredServices')}
                      </p>
                      <p className="text-2xl font-bold text-salon-gold tabular-nums">
                        {services.length}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-salon-textMuted font-medium">
                        {t('home.barbersOnDuty')}
                      </p>
                      <p className="text-2xl font-bold text-white tabular-nums">
                        {barbers.length}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <p className="text-xs uppercase tracking-wider text-salon-textMuted font-medium">
                        {t('home.syncStatus')}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-semibold text-emerald-300">
                          {t('connection.live')}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1.5 text-xs font-medium text-salon-textMuted">
              <span className="tracking-widest uppercase text-[10px] text-salon-gold/80">Scroll</span>
              <ArrowDown className="h-4 w-4 text-salon-gold animate-bounce" />
            </div>
          </section>

          {/* SECTION 3: Salon Experience (Editorial Split) */}
          <section
            id="experience"
            aria-label={t('nav.experience')}
            className="py-20 lg:py-32 relative bg-[#141414] border-t border-white/5"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                {/* Left: Atmospheric Image with Overlaid Card (6 cols) */}
                <div className="lg:col-span-6 relative">
                  <ScrollReveal direction="right" duration={900}>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                      <img
                        src={SALON_IMAGES.experience}
                        alt="Aura Salon Grooming Suite Experience"
                        loading="lazy"
                        className="w-full aspect-[4/3] sm:aspect-[16/11] object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                        aria-hidden="true"
                      />
                    </div>
                  </ScrollReveal>

                  {/* Overlaid Floating Hospitality Card */}
                  <div className="sm:absolute -bottom-8 -right-6 mt-4 sm:mt-0 max-w-xs z-10">
                    <ScrollReveal delay={200} direction="up">
                      <div className="luxury-card-gold rounded-2xl p-5 shadow-2xl space-y-2 backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-salon-gold" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-salon-gold">
                            {t('home.experienceBadgeTitle')}
                          </h4>
                        </div>
                        <p className="text-xs text-salon-textSecondary leading-relaxed">
                          {t('home.experienceBadgeDesc')}
                        </p>
                      </div>
                    </ScrollReveal>
                  </div>
                </div>

                {/* Right: Editorial Narrative & Pillars (6 cols) */}
                <div className="lg:col-span-6 space-y-8">
                  <SectionHeading
                    align="left"
                    eyebrow={t('home.experienceEyebrow')}
                    title={t('home.experienceTitle')}
                    description={t('home.experienceSubtitle')}
                  />

                  {/* 3 Pillars */}
                  <div className="space-y-4 pt-2">
                    {pillars.map((p, idx) => {
                      const Icon = p.icon;
                      return (
                        <ScrollReveal key={idx} delay={idx * 120} direction="up">
                          <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-[#1C1C1C]/60 hover:border-salon-gold/30 hover:bg-[#202020] transition-colors">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-salon-gold/10 border border-salon-gold/30 text-salon-gold shrink-0">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-salon-text">{p.title}</h3>
                              <p className="text-sm text-salon-textMuted leading-relaxed">
                                {p.desc}
                              </p>
                            </div>
                          </div>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Curated Grooming Services */}
          <section
            id="services"
            aria-label={t('nav.services')}
            className="py-20 lg:py-32 relative bg-[#171717]"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
              <SectionHeading
                align="center"
                eyebrow={t('home.servicesEyebrow')}
                title={t('home.servicesTitle')}
                description={t('home.servicesSubtitle')}
              />

              {/* Service Cards Grid (Staggered Scroll Animation) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {services.map((service, idx) => (
                  <ScrollReveal key={service.id} delay={idx * 80} direction="up">
                    <ServiceCard service={service} selectable={false} />
                  </ScrollReveal>
                ))}
              </div>

              {/* Service Section CTA Button */}
              <ScrollReveal delay={200} className="text-center pt-4">
                <Link to="/join">
                  <Button variant="primary" size="lg" rightIcon={ArrowRight} className="font-bold">
                    {t('home.ctaJoin')}
                  </Button>
                </Link>
              </ScrollReveal>
            </div>
          </section>

          {/* SECTION 5: Meet Our Barbers */}
          <section
            id="barbers"
            aria-label={t('nav.barbers')}
            className="py-20 lg:py-32 relative bg-[#131313] border-t border-white/5"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
              <SectionHeading
                align="center"
                eyebrow={t('home.barbersEyebrow')}
                title={t('home.barbersTitle')}
                description={t('home.barbersSubtitle')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {barbers.map((barber, idx) => (
                  <ScrollReveal key={barber.id} delay={idx * 100} direction="up">
                    <BarberCard barber={barber} selectable={false} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 6: How It Works (3-Step Seamless Process) */}
          <section
            id="how-it-works"
            aria-label={t('nav.howItWorks')}
            className="py-20 lg:py-32 relative bg-[#171717]"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
              <SectionHeading
                align="center"
                eyebrow={t('home.howItWorksEyebrow')}
                title={t('home.howItWorksTitle')}
                description={t('home.howItWorksSubtitle')}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <ScrollReveal key={idx} delay={idx * 150} direction="up">
                      <div className="luxury-card rounded-2xl p-8 relative flex flex-col justify-between h-full space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl sm:text-4xl font-black font-serif text-salon-gold/50">
                            {step.num}
                          </span>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-salon-gold/10 border border-salon-gold/30 text-salon-gold">
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-salon-text">{step.title}</h3>
                          <p className="text-sm text-salon-textMuted leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 7: Live Queue Experience Preview */}
          <section
            id="preview"
            aria-label="Queue Experience Preview"
            className="py-16 lg:py-24 relative bg-[#121212] border-t border-white/5"
          >
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
              <SectionHeading
                align="center"
                eyebrow={t('home.previewEyebrow')}
                title={t('home.previewTitle')}
                description={t('home.previewSubtitle')}
              />

              <ScrollReveal delay={150} direction="up">
                <QueuePreviewCard />
              </ScrollReveal>
            </div>
          </section>

          {/* SECTION 8: Final Call to Action */}
          <section
            aria-label="Call to Action"
            className="relative py-24 lg:py-32 overflow-hidden bg-salon-charcoal border-t border-white/10"
          >
            {/* Background Photographic Glow */}
            <div className="absolute inset-0 z-0">
              <img
                src={SALON_IMAGES.experienceDetail}
                alt="Aura Salon Handcrafted Grooming Detail"
                className="h-full w-full object-cover object-center opacity-25"
                loading="lazy"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-[#171717] via-[#171717]/95 to-[#171717]"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
              <ScrollReveal delay={50}>
                <span className="inline-flex items-center gap-2 rounded-full border border-salon-gold/40 bg-salon-gold/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-salon-gold">
                  {t('home.ctaBannerEyebrow')}
                </span>
              </ScrollReveal>

              <ScrollReveal delay={150}>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-serif text-white tracking-tight">
                  {t('home.ctaBannerTitle')}
                </h2>
              </ScrollReveal>

              <ScrollReveal delay={250}>
                <p className="text-base sm:text-lg text-salon-textSecondary max-w-2xl mx-auto leading-relaxed">
                  {t('home.ctaBannerSubtitle')}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={350} className="pt-2">
                <Link to="/join">
                  <Button
                    variant="primary"
                    size="xl"
                    rightIcon={ArrowRight}
                    className="shadow-goldGlow hover:scale-105 active:scale-95 font-bold"
                  >
                    {t('home.ctaBannerBtn')}
                  </Button>
                </Link>
              </ScrollReveal>
            </div>
          </section>
        </main>
      )}

      {/* SECTION 9: Premium Footer */}
      <PremiumFooter />
    </div>
  );
}
