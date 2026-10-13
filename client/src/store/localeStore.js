import { create } from 'zustand';
import en from '../locales/en';
import vi from '../locales/vi';

const translations = { en, vi };
const STORAGE_KEY = 'hobby_vault_lang';

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'vi'].includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to read language preference from localStorage:', e);
  }
  return 'en';
};

export const useLocaleStore = create((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (lang) => {
    if (!['en', 'vi'].includes(lang)) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference to localStorage:', e);
    }
    set({ language: lang });
  },

  /**
   * Helper function to translate a key
   * @param {string} path - Dot-separated path like 'navbar.allCatalog'
   * @param {object} params - Optional interpolation object like { count: 5 }
   * @param {string} fallback - Optional fallback string if key is not found
   */
  t: (path, params = {}, fallback = '') => {
    const currentLang = get().language;
    const currentDict = translations[currentLang] || translations.en;
    const fallbackDict = translations.en;

    const resolve = (dict, keyPath) => {
      if (!dict || !keyPath) return null;
      const keys = keyPath.split('.');
      let current = dict;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return null;
        }
      }
      return typeof current === 'string' ? current : null;
    };

    let text = resolve(currentDict, path) ?? resolve(fallbackDict, path) ?? fallback ?? path;

    // Interpolate {param}
    if (params && typeof params === 'object') {
      Object.keys(params).forEach((p) => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }

    return text;
  },
}));

/**
 * Convenient React hook for components
 */
export const useTranslation = () => {
  const { language, setLanguage, t } = useLocaleStore();
  return {
    language,
    setLanguage,
    t: (path, params, fallback) => t(path, params, fallback),
    isVietnamese: language === 'vi',
    isEnglish: language === 'en',
  };
};

export default useLocaleStore;
