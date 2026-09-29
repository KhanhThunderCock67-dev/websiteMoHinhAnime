import React from 'react';
import { Filter, RotateCcw, Shield, Sparkles, Dices, DollarSign, Check } from 'lucide-react';
import { useFilterStore } from '../store/filterStore';

export const FilterSidebar = ({ categories = [] }) => {
  const { filters, setFilter, setCategory, resetFilters } = useFilterStore();

  const isWarhammer = filters.category === 'warhammer-40k' || !filters.category;
  const isAnime = filters.category === 'anime-figures' || !filters.category;
  const isBoardgame = filters.category === 'board-games' || !filters.category;

  const factions = ['Imperium', 'Chaos', 'Xenos'];
  const scales = ['1/7 Scale', '1/4 Scale', '1/6 Scale', 'Nendoroid', 'Pop Up Parade'];
  const complexities = ['Light', 'Medium', 'Heavy'];
  const playerCounts = ['1', '2', '4', '5', '6'];

  return (
    <div className="w-full bg-vault-900 rounded-2xl border border-slate-800 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-bold text-white font-['Outfit']">Filters</h3>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* Primary Category Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Main Department
        </label>
        <div className="space-y-1.5">
          <button
            onClick={() => setCategory('')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              !filters.category
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            All Departments
          </button>
          <button
            onClick={() => setCategory('anime-figures')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              filters.category === 'anime-figures'
                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Anime Figures
            </span>
          </button>
          <button
            onClick={() => setCategory('warhammer-40k')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              filters.category === 'warhammer-40k'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Warhammer 40,000
            </span>
          </button>
          <button
            onClick={() => setCategory('board-games')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              filters.category === 'board-games'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2">
              <Dices className="w-3.5 h-3.5 text-emerald-400" /> Board Games
            </span>
          </button>
        </div>
      </div>

      {/* Warhammer Faction Multi-choice */}
      {isWarhammer && (
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-2.5">
            Warhammer Faction
          </label>
          <div className="flex flex-wrap gap-1.5">
            {factions.map((f) => {
              const active = filters.faction === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter('faction', active ? '' : f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-semibold border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Anime Scale Multi-choice */}
      {isAnime && (
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-pink-400/90 mb-2.5">
            Figure Scale & Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {scales.map((s) => {
              const active = filters.scale === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter('scale', active ? '' : s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    active
                      ? 'bg-pink-500 text-white font-semibold border-pink-400 shadow-md shadow-pink-500/20'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Board Games Filters */}
      {isBoardgame && (
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400/90 mb-2">
              Complexity Level
            </label>
            <div className="flex flex-wrap gap-1.5">
              {complexities.map((c) => {
                const active = filters.complexity === c;
                return (
                  <button
                    key={c}
                    onClick={() => setFilter('complexity', active ? '' : c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      active
                        ? 'bg-emerald-500 text-slate-950 font-semibold border-emerald-400'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Player Count
            </label>
            <div className="flex gap-1.5">
              {playerCounts.map((count) => {
                const active = filters.players === count;
                return (
                  <button
                    key={count}
                    onClick={() => setFilter('players', active ? '' : count)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                      active
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {count}P
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-slate-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Price Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilter('minPrice', e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilter('maxPrice', e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Availability / Pre-Order checkboxes */}
      <div className="pt-4 border-t border-slate-800 space-y-2.5">
        <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm text-slate-300 select-none">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => setFilter('inStock', e.target.checked)}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
          />
          <span>In Stock Only</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm text-slate-300 select-none">
          <input
            type="checkbox"
            checked={filters.isPreOrder === true || filters.isPreOrder === 'true'}
            onChange={(e) => setFilter('isPreOrder', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
          />
          <span>Pre-Orders Only</span>
        </label>
      </div>
    </div>
  );
};

export default FilterSidebar;
