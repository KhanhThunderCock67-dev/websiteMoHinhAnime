import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Sparkles, RefreshCw, Github, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-vault-950 border-t border-slate-800/80 pt-16 pb-12">
      {/* Guarantees row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-2xl glass-panel">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Authentic Guaranteed</h4>
              <p className="text-xs text-slate-400">Directly sourced from Japan & official distributors</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Collector-Grade Shipping</h4>
              <p className="text-xs text-slate-400">Heavy bubble wrap & corner-reinforced boxes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Official Pre-Orders</h4>
              <p className="text-xs text-slate-400">Zero price hikes once your reservation is booked</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Easy Returns</h4>
              <p className="text-xs text-slate-400">30-day mint in box return policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                HV
              </div>
              <span className="text-xl font-bold font-['Outfit'] text-white">
                HOBBY<span className="text-amber-400">VAULT</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The premier online repository for passionate collectors of Japanese anime scale figures, Warhammer 40k armies, and deep strategic tabletop board games.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">MVC Architecture</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">MERN Stack</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">Zustand</span>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-200 mb-4 tracking-wider uppercase">Categories</h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/catalog?category=anime-figures" className="hover:text-pink-400 transition-colors">Anime Figures (Scale & Nendo)</Link></li>
              <li><Link to="/catalog?category=warhammer-40k" className="hover:text-amber-400 transition-colors">Warhammer 40,000</Link></li>
              <li><Link to="/catalog?category=board-games" className="hover:text-emerald-400 transition-colors">Board Games & Eurogames</Link></li>
              <li><Link to="/catalog?isPreOrder=true" className="hover:text-cyan-400 transition-colors">Pre-Order Vault</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-200 mb-4 tracking-wider uppercase">Collector Care</h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/orders" className="hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link to="/catalog" className="hover:text-white transition-colors">Packaging Standards</Link></li>
              <li><Link to="/catalog" className="hover:text-white transition-colors">Pre-Order FAQ</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Member Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-200 mb-4 tracking-wider uppercase">Administration</h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/admin" className="hover:text-amber-400 transition-colors">Admin Dashboard</Link></li>
              <li><Link to="/admin/products" className="hover:text-amber-400 transition-colors">Inventory Control</Link></li>
              <li><Link to="/admin/orders" className="hover:text-amber-400 transition-colors">Order Pipeline</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 HobbyVault Inc. All trademarks and characters belong to their respective copyright holders.</p>
          <p className="flex items-center gap-1">
            Built with modern MERN Stack & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
