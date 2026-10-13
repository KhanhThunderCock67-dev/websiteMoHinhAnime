import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  FolderTree,
  Store,
  LogOut,
  Shield,
  Package,
  Settings,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/localeStore';
import LanguageSelector from '../components/LanguageSelector';
import CurrencySelector from '../components/CurrencySelector';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: t('admin.navDashboard', {}, 'Dashboard'), path: '/admin', icon: LayoutDashboard, exact: true },
    { name: t('admin.navProducts', {}, 'Products & Stock'), path: '/admin/products', icon: Boxes },
    { name: t('admin.navOrders', {}, 'Orders Pipeline'), path: '/admin/orders', icon: ShoppingBag },
    { name: t('admin.navCategories', {}, 'Categories'), path: '/admin/categories', icon: FolderTree },
    { name: t('adminReviews.title', {}, 'Review Management'), path: '/admin/reviews', icon: Star },
    { name: t('admin.navSettings', {}, 'System Settings'), path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-vault-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-vault-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white font-display tracking-wider">
                HOBBY<span className="text-amber-400">CMS</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                {t('admin.portal', {}, 'Admin Portal')}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <Link
              to="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              {t('admin.customerStorefront', {}, 'Customer Storefront')}
            </Link>
          </div>
        </nav>

        {/* Admin profile footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-vault-950/80 backdrop-blur-sm sticky top-0 z-30 gap-4">
          <h2 className="text-base font-bold text-white font-display truncate">
            {t('admin.portal', {}, 'Management Console')}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <CurrencySelector />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync
            </span>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
