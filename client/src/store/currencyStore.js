import { create } from 'zustand';
import { settingApi } from '../api';

const STORAGE_KEY = 'hobby_vault_currency';
const DEFAULT_RATE = 25400; // 1 USD = 25,400 VND default fallback

const getInitialCurrency = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['USD', 'VND'].includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to read currency from localStorage:', e);
  }
  return 'USD';
};

export const useCurrencyStore = create((set, get) => ({
  currency: getInitialCurrency(),
  usdToVndRate: DEFAULT_RATE,
  lastRateUpdate: null,
  isLoading: false,

  setCurrency: (newCurrency) => {
    if (!['USD', 'VND'].includes(newCurrency)) return;
    try {
      localStorage.setItem(STORAGE_KEY, newCurrency);
    } catch (e) {
      console.error('Failed to save currency to localStorage:', e);
    }
    set({ currency: newCurrency });
  },

  setRate: (rate) => {
    const num = Number(rate);
    if (!isNaN(num) && num > 0) {
      set({ usdToVndRate: num, lastRateUpdate: new Date() });
    }
  },

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await settingApi.get();
      if (res?.data?.success && res.data.data?.settings) {
        const { usdToVndRate, lastRateUpdate } = res.data.data.settings;
        if (usdToVndRate && Number(usdToVndRate) > 0) {
          set({
            usdToVndRate: Number(usdToVndRate),
            lastRateUpdate: lastRateUpdate || new Date(),
          });
        }
      }
    } catch (err) {
      // Fallback cleanly to DEFAULT_RATE if backend is unreachable or offline
      console.warn('Could not sync exchange rate from server, using default rate:', DEFAULT_RATE);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Converts numeric price in USD to target currency number
   */
  convertPrice: (amountInUSD, targetCurrency) => {
    const num = Number(amountInUSD) || 0;
    const curr = targetCurrency || get().currency;
    if (curr === 'VND') {
      const rate = get().usdToVndRate || DEFAULT_RATE;
      return Math.round(num * rate);
    }
    return num;
  },

  /**
   * Formats a USD amount into localized display string
   * @param {number} amountInUSD - Numeric price in USD
   * @param {string} overrideCurrency - Optional override currency ('USD' | 'VND')
   */
  formatPrice: (amountInUSD, overrideCurrency) => {
    const num = Number(amountInUSD) || 0;
    const curr = overrideCurrency || get().currency;

    if (curr === 'VND') {
      const rate = get().usdToVndRate || DEFAULT_RATE;
      const vndAmount = Math.round(num * rate);
      // Format as 250.000 ₫
      const formatted = new Intl.NumberFormat('vi-VN').format(vndAmount);
      return `${formatted} ₫`;
    }

    // Default USD formatting: $1,250.00
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  },
}));

/**
 * Hook for consuming currency in components
 */
export const useCurrency = () => {
  const {
    currency,
    setCurrency,
    usdToVndRate,
    formatPrice,
    convertPrice,
    fetchSettings,
  } = useCurrencyStore();

  return {
    currency,
    setCurrency,
    usdToVndRate,
    formatPrice,
    convertPrice,
    fetchSettings,
    isUSD: currency === 'USD',
    isVND: currency === 'VND',
  };
};

export default useCurrencyStore;
