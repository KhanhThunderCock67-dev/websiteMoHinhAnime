import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Loader2, Package, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { productApi } from '../api';
import { useCurrency } from '../store/currencyStore';
import { useFilterStore } from '../store/filterStore';
import { useTranslation } from '../store/localeStore';

const POPULAR_SEARCHES = [
  'Gundam',
  'One Piece',
  'Warhammer 40k',
  'Scale Figure 1/7',
  'Nendoroid',
  'Board Game',
  'Demon Slayer',
];

export const NavbarSearch = ({ isOpen: controlledIsOpen, setIsOpen: controlledSetIsOpen }) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { setKeyword } = useFilterStore();
  const { t } = useTranslation();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? controlledSetIsOpen : setInternalIsOpen;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Ctrl+K or / to open, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch product suggestions with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setTotalMatches(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await productApi.getAll({
          keyword: query.trim(),
          limit: 6,
        });
        const prods = res.data?.data?.products || [];
        setSuggestions(prods);
        setTotalMatches(res.data?.data?.pagination?.totalItems || prods.length);
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      setKeyword(query.trim());
      setIsOpen(false);
      navigate('/catalog');
    }
  };

  const handleSelectProduct = () => {
    setIsOpen(false);
  };

  const handleSelectPopularTag = (tag) => {
    setQuery(tag);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* 1. Compact Trigger Bar in Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center justify-between flex-1 min-w-[130px] max-w-[180px] lg:max-w-[210px] xl:max-w-xs px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-amber-500/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all duration-200 group shadow-sm text-left shrink"
        aria-label="Open search dialog"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
          <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 truncate whitespace-nowrap">
            {query || t('navbar.searchPlaceholder', {}, 'Tìm mô hình, phe phái, board game...')}
          </span>
        </div>
        <kbd className="hidden 2xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-800/90 rounded border border-slate-700/80 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* 2. Expanded Sliding Search Modal & Suggestions Dropdown */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            {/* Backdrop Blur */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            />

          {/* Centered Expanded Search Container */}
          <div className="relative min-h-screen px-4 pt-6 sm:pt-10 pb-20 flex justify-center items-start pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl transform transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-6 zoom-in-95">
              {/* Enlarge & Highlighted Search Bar */}
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center bg-vault-900 border-2 border-amber-500/90 rounded-2xl shadow-2xl shadow-amber-500/20 px-4 py-3 sm:py-3.5 ring-4 ring-amber-500/10 transition-all"
              >
                <Search className="w-5 h-5 text-amber-400 shrink-0 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(
                    'navbar.searchPlaceholder',
                    {},
                    'Nhập tên nhân vật, hãng sản xuất, hoặc mã mô hình...'
                  )}
                  className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none font-medium pr-2"
                />

                {/* Right utility buttons */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isLoading && (
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin mr-1" />
                  )}
                  {query && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono text-slate-400 hover:text-white border border-slate-700 transition-colors"
                  >
                    <span className="hidden sm:inline">ESC</span>
                    <X className="w-3.5 h-3.5 sm:hidden" />
                  </button>
                </div>
              </form>

              {/* Suggestions Panel Attached Below */}
              <div className="mt-2.5 bg-vault-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Case A: User has entered a query */}
                {query.trim() ? (
                  <>
                    {/* Header */}
                    <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Gợi ý sản phẩm {totalMatches > 0 && `(${totalMatches})`}
                      </span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        Nhấn <kbd className="font-mono text-slate-400 font-bold">↵ Enter</kbd> để tìm kiếm
                      </span>
                    </div>

                    {/* Product List */}
                    {suggestions.length > 0 ? (
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
                        {suggestions.map((p) => {
                          const effectivePrice =
                            p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
                          const hasDiscount =
                            p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;

                          return (
                            <Link
                              key={p._id}
                              to={`/product/${p.slug || p._id}`}
                              onClick={handleSelectProduct}
                              className="flex items-center gap-3.5 p-3 sm:p-3.5 hover:bg-slate-800/70 transition-colors group"
                            >
                              <img
                                src={
                                  p.images?.[0] ||
                                  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=120&q=80'
                                }
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 group-hover:border-amber-500/50 transition-colors shrink-0"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  {p.category?.name && (
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                      {p.category.name}
                                    </span>
                                  )}
                                  {p.brand && (
                                    <span className="text-xs text-slate-400 truncate">
                                      {p.brand}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                  {p.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs sm:text-sm font-bold text-amber-400 font-display">
                                    {formatPrice(effectivePrice)}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-xs text-slate-500 line-through">
                                      {formatPrice(p.price)}
                                    </span>
                                  )}
                                  {p.isPreOrder && (
                                    <span className="text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.2 rounded font-semibold border border-pink-500/20">
                                      Pre-Order
                                    </span>
                                  )}
                                </div>
                              </div>

                              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : !isLoading ? (
                      <div className="p-8 text-center space-y-2">
                        <Package className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
                        <p className="text-sm font-semibold text-slate-300">
                          Không tìm thấy sản phẩm nào khớp với "{query}"
                        </p>
                        <p className="text-xs text-slate-500">
                          Hãy thử tìm kiếm với tên nhân vật, hãng sản xuất hoặc danh mục khác.
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2.5">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                        <span className="text-sm">Đang tìm kiếm sản phẩm...</span>
                      </div>
                    )}

                    {/* View All Matches Footer */}
                    {suggestions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full p-3 bg-slate-950/80 hover:bg-amber-500/10 text-amber-400 font-semibold text-xs text-center border-t border-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>Xem tất cả kết quả cho "{query}"</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  /* Case B: Query is empty - Show Popular & Quick Searches */
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2.5">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span>Từ khóa thịnh hành</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SEARCHES.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleSelectPopularTag(tag)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-amber-500/15 border border-slate-700/60 hover:border-amber-500/40 text-xs text-slate-300 hover:text-amber-300 font-medium transition-all"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Mẹo: Bạn có thể tìm theo tên Anime, dòng figure hoặc thương hiệu</span>
                      <span className="hidden sm:inline">Phím tắt: ESC để đóng</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default NavbarSearch;
