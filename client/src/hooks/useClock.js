import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export function useClock() {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const locale = language === 'gu' ? 'gu-IN' : 'en-IN';

  const timeFormatted = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  const dateFormatted = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(now);

  return { now, timeFormatted, dateFormatted };
}
