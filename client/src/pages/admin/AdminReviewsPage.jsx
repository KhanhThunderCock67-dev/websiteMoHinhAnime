import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  Camera,
  ExternalLink,
  Loader2,
  AlertCircle,
  Package,
  Layers,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useTranslation, useLocaleStore } from '../../store/localeStore';
import { reviewApi, categoryApi } from '../../api';
import { getCriterionLabel } from '../../utils/reviewCriteria';
import ImageLightboxModal from '../../components/Reviews/ImageLightboxModal';

export const AdminReviewsPage = () => {
  const { t, language } = useTranslation();
  const currentLanguage = language || 'vi';

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    hidden: 0,
    verified: 0,
    averageRating: 0,
    categoryStats: {},
  });
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVerified, setSelectedVerified] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Lightbox
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  // Action loading state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getAll();
        const rawCats = res.data?.data?.categories || res.data?.data || [];
        setCategories(Array.isArray(rawCats) ? rawCats : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Fetch admin reviews
  const fetchAdminReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 15,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        rating: selectedRating || undefined,
        status: selectedStatus || undefined,
        isVerified: selectedVerified !== '' ? selectedVerified : undefined,
      };

      const res = await reviewApi.getAdminReviews(params);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, selectedCategory, selectedRating, selectedStatus, selectedVerified]);

  useEffect(() => {
    fetchAdminReviews();
  }, [fetchAdminReviews]);

  // Status toggle handler
  const handleToggleStatus = async (review) => {
    const newStatus = review.status === 'active' ? 'hidden' : 'active';
    setActionLoadingId(review._id);
    try {
      await reviewApi.updateStatus(review._id, newStatus);
      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, status: newStatus } : r))
      );
      // Re-fetch stats to reflect rating change
      fetchAdminReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update review status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(t('adminReviews.deleteConfirm', null, 'Are you sure you want to delete this review? Product ratings will be recalculated.'))) {
      return;
    }
    setActionLoadingId(reviewId);
    try {
      await reviewApi.deleteAdmin(reviewId);
      fetchAdminReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenLightbox = (images, index) => {
    setLightboxState({
      isOpen: true,
      images,
      currentIndex: index,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <span>{t('admin.portal', null, 'Control Panel')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          {t('adminReviews.title', null, 'Review Management & Moderation')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('adminReviews.subtitle', null, 'Moderate collector ratings, inspect attached photos, and maintain community trust.')}
        </p>
      </div>

      {/* Global Analytics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-vault-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">
            {t('adminReviews.allReviews', null, 'Total Reviews')}
          </span>
          <p className="text-2xl font-black text-white font-display">{stats.total}</p>
        </div>

        {/* Average Rating */}
        <div className="p-4 sm:p-5 rounded-2xl bg-vault-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">
            {t('adminReviews.averageRating', null, 'Average Rating')}
          </span>
          <p className="text-2xl font-black text-amber-400 font-display flex items-center gap-1.5">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </p>
        </div>

        {/* Active Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-vault-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">
            {t('adminReviews.activeReviews', null, 'Active')}
          </span>
          <p className="text-2xl font-black text-emerald-400 font-display">{stats.active}</p>
        </div>

        {/* Hidden Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-vault-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">
            {t('adminReviews.hiddenReviews', null, 'Hidden (Excluded)')}
          </span>
          <p className="text-2xl font-black text-rose-400 font-display">{stats.hidden}</p>
        </div>

        {/* Verified Purchases */}
        <div className="p-4 sm:p-5 rounded-2xl bg-vault-900 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-slate-400">
            {t('adminReviews.verifiedCount', null, 'Verified Purchases')}
          </span>
          <p className="text-2xl font-black text-cyan-400 font-display">{stats.verified}</p>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      {stats.categoryStats && Object.keys(stats.categoryStats).length > 0 && (
        <div className="p-5 rounded-2xl bg-vault-900/60 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            {t('adminReviews.categoryBreakdown', null, 'Category Performance & Volume')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(stats.categoryStats || {}).map(([catSlug, catData]) => (
              <div
                key={catSlug}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white capitalize block">
                    {catSlug.replace('-', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t('reviews.reviewsCount', { count: catData?.totalReviews || 0 }, `${catData?.totalReviews || 0} Reviews`)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                    {Number(catData?.avgRating || 0).toFixed(1)} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-vault-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('adminReviews.searchPlaceholder', null, 'Search user, product, or review text...')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{t('adminReviews.filterCategory', null, 'All Categories')}</option>
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Rating filter */}
        <select
          value={selectedRating}
          onChange={(e) => {
            setSelectedRating(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{t('adminReviews.filterRating', null, 'All Ratings')}</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{t('adminReviews.filterStatus', null, 'All Statuses')}</option>
          <option value="active">{t('adminReviews.statusActive', null, 'Active')}</option>
          <option value="hidden">{t('adminReviews.statusHidden', null, 'Hidden')}</option>
        </select>

        {/* Verified filter */}
        <select
          value={selectedVerified}
          onChange={(e) => {
            setSelectedVerified(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{t('adminReviews.filterVerified', null, 'Verified Purchase')}</option>
          <option value="true">Verified Only</option>
          <option value="false">Unverified Only</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl bg-vault-900 border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-400">{t('common.loading', null, 'Loading reviews...')}</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t('adminReviews.colProduct', null, 'Product')}</th>
                  <th className="p-4">{t('adminReviews.colReviewer', null, 'Reviewer')}</th>
                  <th className="p-4">{t('adminReviews.colRating', null, 'Rating')}</th>
                  <th className="p-4">{t('adminReviews.colComment', null, 'Comment & Photos')}</th>
                  <th className="p-4">{t('adminReviews.colStatus', null, 'Status')}</th>
                  <th className="p-4 text-right">{t('adminReviews.colActions', null, 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {reviews.map((rev) => {
                  const isProcessing = actionLoadingId === rev._id;
                  return (
                    <tr key={rev._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Product */}
                      <td className="p-4 max-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            {rev.product?.images?.[0] ? (
                              <img
                                src={rev.product.images[0]}
                                alt={rev.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            <Link
                              to={`/product/${rev.product?.slug || rev.product?._id}`}
                              target="_blank"
                              className="font-bold text-white hover:text-amber-400 line-clamp-1 transition-colors flex items-center gap-1"
                            >
                              <span>{rev.product?.name || 'Unknown Product'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                            </Link>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                              {rev.product?.categorySlug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td className="p-4 max-w-[180px]">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-100 truncate">
                            {rev.user?.name || 'Anonymous User'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {rev.user?.email || 'N/A'}
                          </p>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              {t('reviews.verifiedPurchase', null, 'Verified')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating & Criteria */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-black text-amber-400 text-sm">
                            <span>{rev.rating}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </div>

                          {rev.criteria && rev.criteria.length > 0 && (
                            <div className="space-y-0.5 text-[10px] text-slate-400">
                              {rev.criteria.map((c, i) => (
                                <div key={i} className="truncate max-w-[150px]">
                                  {getCriterionLabel(c.name, currentLanguage)}: <strong className="text-amber-400">{c.rating}★</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Comment & Attached Photos */}
                      <td className="p-4 max-w-[320px]">
                        <div className="space-y-2">
                          <p className="text-slate-200 text-xs line-clamp-3 leading-relaxed">
                            {rev.comment}
                          </p>

                          {rev.images && rev.images.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {rev.images.map((img, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => handleOpenLightbox(rev.images, imgIdx)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 hover:border-amber-400 transition-all cursor-zoom-in shrink-0"
                                >
                                  <img
                                    src={img}
                                    alt="Review thumbnail"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                              <span className="text-[10px] text-slate-500 ml-1">
                                ({rev.images.length})
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            rev.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {rev.status === 'active'
                            ? t('adminReviews.statusActive', null, 'Active')
                            : t('adminReviews.statusHidden', null, 'Hidden')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hide / Unhide button */}
                          <button
                            onClick={() => handleToggleStatus(rev)}
                            disabled={isProcessing}
                            className={`p-2 rounded-xl transition-colors border ${
                              rev.status === 'active'
                                ? 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-800'
                                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30'
                            }`}
                            title={
                              rev.status === 'active'
                                ? t('adminReviews.hideReview', null, 'Hide from Storefront')
                                : t('adminReviews.showReview', null, 'Unhide')
                            }
                          >
                            {rev.status === 'active' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            disabled={isProcessing}
                            className="p-2 rounded-xl bg-slate-950/70 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors"
                            title={t('adminReviews.deleteReview', null, 'Delete Permanently')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No reviews found matching criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {reviews.length} of {pagination.total} reviews
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    p === currentPage
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for review photos */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        images={lightboxState.images}
        currentIndex={lightboxState.currentIndex}
        setCurrentIndex={(fnOrVal) =>
          setLightboxState((prev) => ({
            ...prev,
            currentIndex: typeof fnOrVal === 'function' ? fnOrVal(prev.currentIndex) : fnOrVal,
          }))
        }
      />
    </div>
  );
};

export default AdminReviewsPage;
