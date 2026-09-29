import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  User,
  Shield,
  LogOut,
  Package,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useFilterStore } from '../store/filterStore';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setIsOpen, getTotalCount } = useCartStore();
  const { setKeyword, setCategory } = useFilterStore();

  const [searchInput, setSearchInput] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = getTotalCount();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setKeyword(searchInput.trim());
      navigate('/catalog');
    }
  };

  const handleCategoryClick = (catSlug) => {
    setCategory(catSlug);
    setMobileMenuOpen(false);
    navigate('/catalog');
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group shrink-0"
            onClick={() => setCategory('')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider font-['Outfit'] bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent">
                HOBBY<span className="text-amber-400">VAULT</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Figures & Tabletop
              </span>
            </div>
          </Link>

          {/* Desktop Category Navigation */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-sm">
            <button
              onClick={() => handleCategoryClick('')}
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                location.pathname === '/catalog' && !location.search
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              All Catalog
            </button>
            <button
              onClick={() => handleCategoryClick('anime-figures')}
              className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
            >
              Anime Figures
            </button>
            <button
              onClick={() => handleCategoryClick('warhammer-40k')}
              className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              Warhammer 40k
            </button>
            <button
              onClick={() => handleCategoryClick('board-games')}
              className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              Board Games
            </button>
          </nav>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center relative flex-1 max-w-xs xl:max-w-sm"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search figures, factions, boardgames..."
              className="w-full bg-slate-900/80 border border-slate-700/80 text-sm rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all duration-200"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-amber-500/40"
                  />
                  <span className="text-xs font-semibold text-slate-200 max-w-[90px] truncate hidden sm:inline-block">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl glass-dropdown p-2 shadow-2xl z-50 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                        {user.role}
                      </span>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      My Orders
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold px-3.5 py-2 rounded-xl shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search catalog..."
                className="w-full bg-slate-900 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 text-slate-200"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </form>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleCategoryClick('')}
                className="p-2.5 text-left text-sm font-medium rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
              >
                All Catalog
              </button>
              <button
                onClick={() => handleCategoryClick('anime-figures')}
                className="p-2.5 text-left text-sm font-medium rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300"
              >
                Anime Figures
              </button>
              <button
                onClick={() => handleCategoryClick('warhammer-40k')}
                className="p-2.5 text-left text-sm font-medium rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300"
              >
                Warhammer 40k
              </button>
              <button
                onClick={() => handleCategoryClick('board-games')}
                className="p-2.5 text-left text-sm font-medium rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              >
                Board Games
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
