import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import gu from '../locales/gu.json';

const TRANSLATIONS = { en, gu };
const STORAGE_KEY = 'aura_salon_language';

const LanguageContext = createContext(null);

function resolveKey(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'gu' ? 'gu' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = language === 'gu' ? 'gu' : 'en';
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage failures in restricted browsing contexts
    }
  }, [language]);

  const setLanguage = useCallback((nextLang) => {
    setLanguageState(nextLang === 'gu' ? 'gu' : 'en');
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'gu' : 'en'));
  }, []);

  const t = useCallback(
    (key, vars = {}) => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      let text = resolveKey(dict, key);
      if (text === undefined) {
        text = resolveKey(TRANSLATIONS.en, key) ?? key;
      }
      if (typeof text !== 'string') return String(text);

      return text.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        vars[token] !== undefined && vars[token] !== null ? String(vars[token]) : `{{${token}}}`
      );
    },
    [language]
  );

  const getLocalizedName = useCallback(
    (nameEn, nameGu) => (language === 'gu' ? nameGu || nameEn : nameEn || nameGu),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      getLocalizedName,
    }),
    [language, setLanguage, toggleLanguage, t, getLocalizedName]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
