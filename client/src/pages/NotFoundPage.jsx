import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { CustomerLayout } from '../layouts/CustomerLayout.jsx';
import { EmptyState } from '../components/ui/StateViews.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <CustomerLayout maxWidth="max-w-xl">
      <EmptyState
        icon={Compass}
        title={t('common.notFoundTitle')}
        description={t('common.notFoundDescription')}
        action={
          <Link to="/">
            <Button variant="primary">{t('common.goHome')}</Button>
          </Link>
        }
      />
    </CustomerLayout>
  );
}
