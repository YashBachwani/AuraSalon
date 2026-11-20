import { Link } from 'react-router-dom';
import { BrandMark } from '../../assets/BrandMark.jsx';
import { useConnection } from '../../context/ConnectionContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function BrandHeader({ subtitle = null, to = '/', size = 'md' }) {
  const { bootstrap } = useConnection();
  const { t, getLocalizedName } = useLanguage();

  const salonName = bootstrap?.salon
    ? getLocalizedName(bootstrap.salon.nameEn, bootstrap.salon.nameGu)
    : t('brand.defaultName');

  const markSize = size === 'tv' ? 'h-12 w-12' : 'h-9 w-9';
  const titleSize = size === 'tv' ? 'text-2xl lg:text-3xl' : 'text-lg sm:text-xl';

  return (
    <Link to={to} className="inline-flex items-center gap-3 group focus:outline-none">
      <BrandMark className={`${markSize} shrink-0 transition-transform group-hover:scale-105`} />
      <div className="min-w-0">
        <span className={`block font-bold tracking-tight text-salon-text truncate ${titleSize}`}>
          {salonName}
        </span>
        {subtitle ? (
          <span className="block text-xs font-medium text-salon-textMuted truncate">{subtitle}</span>
        ) : null}
      </div>
    </Link>
  );
}
