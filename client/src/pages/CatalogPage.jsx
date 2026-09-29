import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, X, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { productApi } from '../api';
import { useFilterStore } from '../store/filterStore';

export const CatalogPage = () => {
  const [searchParams] = useSearchParams();
  const { filters, setFilter, setCategory, setPage, resetFilters } = useFilterStore();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Sync URL query params if present on initial load
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategory(cat);
    }
    const preOrder = searchParams.get('isPreOrder');
    if (preOrder) {
      setFilter('isPreOrder', preOrder);
    }
  }, [searchParams]);

  // Fetch products whenever filters change
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const queryParams = {
          category: filters.category || undefined,
          subCategory: filters.subCategory || undefined,
          brand: filters.brand || undefined,
          faction: filters.faction || undefined,
          scale: filters.scale || undefined,
          complexity: filters.complexity || undefined,
          players: filters.players || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          inStock: filters.inStock ? true : undefined,
          isPreOrder: filters.isPreOrder !== '' ? filters.isPreOrder : undefined,
          keyword: filters.keyword || undefined,
          sort: filters.sort,
          page: filters.page,
          limit: 12,
        };

        const response = await productApi.getAll(queryParams);
        setProducts(response.data.data.products || []);
        setPagination(
          response.data.data.pagination || { page: 1, totalPages: 1, totalItems: 0 }
        );
      } catch (err) {
        console.error('Failed to fetch catalog products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, [filters]);

  const activeFilters = [];
  if (filters.category) activeFilters.push({ key: 'category', label: `Category: ${filters.category}`, clear: () => setCategory('') });
  if (filters.faction) activeFilters.push({ key: 'faction', label: `Faction: ${filters.faction}`, clear: () => setFilter('faction', '') });
  if (filters.scale) activeFilters.push({ key: 'scale', label: `Scale: ${filters.scale}`, clear: () => setFilter('scale', '') });
  if (filters.complexity) activeFilters.push({ key: 'complexity', label: `Complexity: ${filters.complexity}`, clear: () => setFilter('complexity', '') });
  if (filters.players) activeFilters.push({ key: 'players', label: `${filters.players} Players`, clear: () => setFilter('players', '') });
  if (filters.inStock) activeFilters.push({ key: 'inStock', label: 'In Stock Only', clear: () => setFilter('inStock', false) });
  if (filters.isPreOrder) activeFilters.push({ key: 'isPreOrder', label: 'Pre-Orders Only', clear: () => setFilter('isPreOrder', '') });
  if (filters.keyword) activeFilters.push({ key: 'keyword', label: `Search: "${filters.keyword}"`, clear: () => setFilter('keyword', '') });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title & Breadcrumb */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
          {filters.category === 'anime-figures'
            ? 'Anime Scale Figures & Nendoroids'
            : filters.category === 'warhammer-40k'
            ? 'Warhammer 40,000 Armory'
            : filters.category === 'board-games'
            ? 'Tabletop Strategy & Board Games'
            : 'Hobby & Tabletop Catalog'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Showing {pagination.totalItems} verified collector items
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <FilterSidebar />
          </div>
        </div>

        {/* Right Column: Active Chips, Sort, and Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Controls Bar */}
          <div className="p-4 rounded-2xl bg-vault-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Active filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.length > 0 ? (
                <>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Active:
                  </span>
                  {activeFilters.map((af) => (
                    <span
                      key={af.key}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                      {af.label}
                      <button
                        onClick={af.clear}
                        className="hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={resetFilters}
                    className="text-xs text-slate-400 hover:text-white underline ml-1"
                  >
                    Clear All
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-400">All filters default</span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2.5 ml-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <label htmlFor="sort-select" className="text-xs text-slate-400 font-semibold">
                Sort:
              </label>
              <select
                id="sort-select"
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="newest">Newest Releases</option>
                <option value="best-selling">Best Selling</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-96 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-vault-900 border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No products found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No collector items match your current combination of filters. Try broadening your criteria or resetting filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, filters.page - 1))}
                disabled={filters.page <= 1}
                className="p-2.5 rounded-xl bg-vault-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                    filters.page === p
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                      : 'bg-vault-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(Math.min(pagination.totalPages, filters.page + 1))}
                disabled={filters.page >= pagination.totalPages}
                className="p-2.5 rounded-xl bg-vault-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
