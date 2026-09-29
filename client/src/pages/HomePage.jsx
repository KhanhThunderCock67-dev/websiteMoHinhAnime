import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Dices,
  Flame,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productApi } from '../api';
import { useFilterStore } from '../store/filterStore';

export const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setCategory } = useFilterStore();

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const response = await productApi.getFeatured();
        setFeaturedProducts(response.data.data.products || []);
      } catch (err) {
        console.error('Error loading featured products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden border-b border-slate-800">
        {/* Background glow & mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-vault-950 to-vault-950" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-md shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Hobby Emporium 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight font-['Outfit'] max-w-4xl mx-auto leading-tight">
            Forge Your Army. <br />
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
              Enshrine Your Waifus.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The collector’s haven for authentic Japanese anime scale figures, Citadel Warhammer 40,000 battleforces, and world-class board games.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/catalog"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2 transition-all hover:scale-105"
            >
              Explore Full Vault
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/catalog?isPreOrder=true"
              className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all"
            >
              Pre-Order Showcase
            </Link>
          </div>
        </div>
      </section>

      {/* Category Showcase Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Select Your Hobby Discipline
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Dive directly into our specialized domains with faceted filters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Anime */}
          <Link
            to="/catalog?category=anime-figures"
            onClick={() => setCategory('anime-figures')}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-vault-900 p-8 flex flex-col justify-between hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-['Outfit'] group-hover:text-pink-400 transition-colors">
                Anime Scale Figures
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                1/7 & 1/4 scales, Nendoroids, Pop Up Parade from Alter, Good Smile Company, and Kotobukiya.
              </p>
            </div>
            <div className="mt-8 flex items-center text-xs font-bold text-pink-400 gap-2 uppercase tracking-wider">
              <span>Enter Figure Vault</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Warhammer */}
          <Link
            to="/catalog?category=warhammer-40k"
            onClick={() => setCategory('warhammer-40k')}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-vault-900 p-8 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-['Outfit'] group-hover:text-amber-400 transition-colors">
                Warhammer 40,000
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Imperium, Chaos, and Xenos Combat Patrols, Kill Team boxes, and Citadel miniatures.
              </p>
            </div>
            <div className="mt-8 flex items-center text-xs font-bold text-amber-400 gap-2 uppercase tracking-wider">
              <span>Enter Grimdark Armory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Board Games */}
          <Link
            to="/catalog?category=board-games"
            onClick={() => setCategory('board-games')}
            className="group relative rounded-3xl overflow-hidden border border-slate-800 bg-vault-900 p-8 flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Dices className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-['Outfit'] group-hover:text-emerald-400 transition-colors">
                Tabletop & Board Games
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Heavy eurogames, worker placement, and cooperative strategy gems like Scythe, Terraforming Mars, Dune.
              </p>
            </div>
            <div className="mt-8 flex items-center text-xs font-bold text-emerald-400 gap-2 uppercase tracking-wider">
              <span>Explore Board Games</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4" />
              <span>Top Pick Collector Pieces</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Featured Acquisitions
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            View Complete Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Pre-Order Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Clock className="w-3.5 h-3.5" /> Guaranteed Price Lock
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
              Never Miss A Grail Figure or Limited Release
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We coordinate directly with Japanese manufacturers and Games Workshop to ensure our collectors receive mint packaging with verified authenticity certificates.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <Link
                to="/catalog?isPreOrder=true"
                className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/20"
              >
                Browse Upcoming Releases
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
