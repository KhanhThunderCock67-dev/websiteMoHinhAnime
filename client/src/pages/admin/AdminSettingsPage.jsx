import React, { useState, useEffect } from 'react';
import {
  Coins,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Sliders,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { settingApi } from '../../api';
import { useCurrency } from '../../store/currencyStore';
import { useTranslation } from '../../store/localeStore';

export const AdminSettingsPage = () => {
  const { t } = useTranslation();
  const { setRate, fetchSettings: refreshGlobalSettings } = useCurrency();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState({
    usdToVndRate: 25400,
    defaultCurrency: 'USD',
    defaultLanguage: 'en',
    enableEnglish: true,
    enableVietnamese: true,
    lastRateUpdate: null,
  });

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingApi.get();
      if (res?.data?.success && res.data.data?.settings) {
        setSettings(res.data.data.settings);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
      setErrorMsg('Failed to load system settings from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const rateNum = Number(settings.usdToVndRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setErrorMsg('Exchange rate must be a positive number.');
      setIsSaving(false);
      return;
    }

    try {
      const res = await settingApi.update({
        usdToVndRate: rateNum,
        defaultCurrency: settings.defaultCurrency,
        defaultLanguage: settings.defaultLanguage,
        enableEnglish: settings.enableEnglish,
        enableVietnamese: settings.enableVietnamese,
      });

      if (res?.data?.success) {
        setSettings(res.data.data.settings);
        setRate(rateNum);
        refreshGlobalSettings();
        setSuccessMsg(t('adminSettings.saveSuccess', {}, 'Settings saved successfully!'));
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update system settings:', err);
      setErrorMsg(err.response?.data?.message || t('adminSettings.saveError', {}, 'Failed to update settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400 font-medium">{t('common.loading', {}, 'Loading settings...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-wide">
          {t('adminSettings.title', {}, 'SYSTEM & LOCALIZATION SETTINGS')}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {t('adminSettings.subtitle', {}, 'Manage currency exchange rates, default language, and localization preferences.')}
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Currency & Exchange Rate */}
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t('adminSettings.currencySection', {}, 'Exchange Rate & Multi-Currency')}
              </h2>
              <p className="text-xs text-slate-400">
                Configure real-time rate multipliers for presenting prices in Vietnamese Dong.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('adminSettings.exchangeRateLabel', {}, 'USD to VND Exchange Rate *')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={settings.usdToVndRate}
                  onChange={(e) => setSettings({ ...settings, usdToVndRate: e.target.value })}
                  placeholder="25400"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-500 font-bold">
                  VND / 1 USD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                {t('adminSettings.exchangeRateHelp', {}, 'Used to convert prices from USD base to Vietnamese Dong (VND) for presentation.')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('adminSettings.defaultCurrencyLabel', {}, 'Default Storefront Currency')}
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="VND">VND (₫) - Vietnamese Dong</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Currency presented to new visitors before they customize their preference.
              </p>
            </div>
          </div>

          {/* Rate conversion live preview box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Info className="w-4 h-4" />
              <span>Live Conversion Preview:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">$10.00 USD</span>
                <span className="font-bold text-white font-display">
                  {(10 * (Number(settings.usdToVndRate) || 25400)).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">$50.00 USD</span>
                <span className="font-bold text-white font-display">
                  {(50 * (Number(settings.usdToVndRate) || 25400)).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">$100.00 USD</span>
                <span className="font-bold text-white font-display">
                  {(100 * (Number(settings.usdToVndRate) || 25400)).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">$250.00 USD</span>
                <span className="font-bold text-white font-display">
                  {(250 * (Number(settings.usdToVndRate) || 25400)).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Language & Localization */}
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t('adminSettings.languageSection', {}, 'Language & Internationalization')}
              </h2>
              <p className="text-xs text-slate-400">
                Manage supported languages and default locale for storefront visitors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('adminSettings.defaultLanguageLabel', {}, 'Default Website Language')}
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="en">🇺🇸 English (US)</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enabled Locales
              </label>
              <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEnglish}
                    onChange={(e) => setSettings({ ...settings, enableEnglish: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-800"
                  />
                  <span>{t('adminSettings.enableEnglishLabel', {}, 'Enable English (US)')}</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableVietnamese}
                    onChange={(e) => setSettings({ ...settings, enableVietnamese: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-800"
                  />
                  <span>{t('adminSettings.enableVietnameseLabel', {}, 'Enable Vietnamese (Tiếng Việt)')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Status & Metadata */}
        <div className="p-6 rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{t('adminSettings.statusSection', {}, 'System Status')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">{t('adminSettings.currentRate', {}, 'Current Active Rate:')}</span>
              <span className="font-bold text-amber-400 font-mono">
                1 USD = {Number(settings.usdToVndRate).toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">{t('adminSettings.lastUpdated', {}, 'Last Rate Update:')}</span>
              <span className="font-semibold text-slate-300">
                {formatDate(settings.lastRateUpdate)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic leading-relaxed">
            {t('adminSettings.noteBaseCurrency', {}, 'Note: Product prices in the database are stored in USD as the canonical base currency. VND prices are dynamically calculated using the official exchange rate configured above.')}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('adminSettings.savingBtn', {}, 'Saving Settings...')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('adminSettings.saveBtn', {}, 'Save System Settings')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
