import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Coins } from 'lucide-react';
import { useCurrency } from '../store/currencyStore';
import { useTranslation } from '../store/localeStore';

export const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { code: 'USD', symbol: '$', label: 'USD ($)', fullLabel: 'US Dollar' },
    { code: 'VND', symbol: '₫', label: 'VND (₫)', fullLabel: 'Việt Nam Đồng' },
  ];

  const currentOption = options.find((o) => o.code === currency) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all duration-150 whitespace-nowrap shrink-0"
        aria-label="Select Currency"
        title={currentOption.fullLabel}
      >
        <span className="font-bold text-amber-400">{currentOption.symbol}</span>
        <span className="tracking-wide">{currentOption.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl glass-dropdown p-1.5 shadow-2xl z-50 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('common.currency', {}, 'Currency')}
          </div>
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                setCurrency(opt.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                currency === opt.code
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-bold text-amber-400">{opt.symbol}</span>
                <div className="text-left">
                  <p className="font-semibold">{opt.code}</p>
                  <p className="text-[10px] text-slate-400">{opt.fullLabel}</p>
                </div>
              </div>
              {currency === opt.code && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
