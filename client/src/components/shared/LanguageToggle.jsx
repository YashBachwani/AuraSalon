import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function LanguageToggle({ className = '' }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-salon-border bg-salon-deep/90 p-1 min-h-[44px] ${className}`}
      role="group"
      aria-label={t('nav.languageToggleLabel')}
    >
      <Languages className="h-4 w-4 text-salon-gold ml-2 mr-1.5 hidden sm:block shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={[
          'min-h-[34px] px-2.5 rounded-lg text-xs font-semibold transition-colors',
          language === 'en'
            ? 'bg-salon-gold text-salon-deep'
            : 'text-salon-textSecondary hover:text-salon-text',
        ].join(' ')}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('gu')}
        aria-pressed={language === 'gu'}
        className={[
          'min-h-[34px] px-2.5 rounded-lg text-xs font-semibold transition-colors',
          language === 'gu'
            ? 'bg-salon-gold text-salon-deep'
            : 'text-salon-textSecondary hover:text-salon-text',
        ].join(' ')}
      >
        ગુજરાતી
      </button>
    </div>
  );
}
