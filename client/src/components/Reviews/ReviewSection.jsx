import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ShieldCheck,
  Camera,
  Filter,
  ArrowUpDown,
  Plus,
  Edit3,
  Loader2,
  Sparkles,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation, useLocaleStore } from '../../store/localeStore';
import { useAuthStore } from '../../store/authStore';
import { reviewApi } from '../../api';
import { getCriterionLabel } from '../../utils/reviewCriteria';
import ReviewCard from './ReviewCard';
import ReviewFormModal from './ReviewFormModal';
import ImageLightboxModal from './ImageLightboxModal';

export const ReviewSection = ({ productId, product }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLocaleStore();
  const { isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    verifiedCount: 0,
    withImagesCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    criteriaAverages: {},
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [userReview, setUserReview] = useState(null);

  // Filters & Sorting state
  const [ratingFilter, setRatingFilter] = useState('all');
  const [hasImagesFilter, setHasImagesFilter] = useState(false);
  const [isVerifiedFilter, setIsVerifiedFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        rating: ratingFilter !== 'all' ? ratingFilter : undefined,
        hasImages: hasImagesFilter ? 'true' : undefined,
        isVerified: isVerifiedFilter ? 'true' : undefined,
      };

      const res = await reviewApi.getByProduct(productId, params);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
        setUserReview(res.data.data.userReview || null);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentPage, sortBy, ratingFilter, hasImagesFilter, isVerifiedFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset to page 1 when changing filters or sorting
  const handleRatingFilterChange = (val) => {
    setRatingFilter(val);
    setCurrentPage(1);
  };

  const handleTogglePhotosOnly = () => {
    setHasImagesFilter((prev) => !prev);
    setCurrentPage(1);
  };

  const handleToggleVerifiedOnly = () => {
    setIsVerifiedFilter((prev) => !prev);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // Helpful vote toggle
  const handleVote = async (reviewId) => {
    try {
      const res = await reviewApi.toggleHelpfulVote(reviewId);
      if (res.data?.success) {
        const { hasVoted, helpfulCount } = res.data.data;
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, hasVoted, helpfulCount } : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(t('reviews.deleteConfirm', null, 'Are you sure you want to delete your review?'))) {
      return;
    }
    try {
      await reviewApi.delete(reviewId);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  // Lightbox handlers
  const handleOpenLightbox = (images, index) => {
    setLightboxState({
      isOpen: true,
      images,
      currentIndex: index,
    });
  };

  const handleCloseLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <section className="pt-10 border-t border-slate-800 space-y-8" id="customer-reviews">
      {/* Section Title & CTA Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{t('reviews.title', null, 'Collector Reviews & Ratings')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {stats.totalReviews > 0
              ? `${stats.averageRating.toFixed(1)} / 5.0 (${t('reviews.reviewsCount', { count: stats.totalReviews }, `${stats.totalReviews} Reviews`)})`
              : t('reviews.noReviewsWord', null, 'Không')}
          </h2>
        </div>

        <div>
          {isAuthenticated ? (
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {userReview ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>{t('reviews.editReview', null, 'Edit Your Review')}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t('reviews.writeReview', null, 'Write a Review')}</span>
                </>
              )}
            </button>
          ) : (
            <a
              href="/login"
              className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{t('reviews.loginToReview', null, 'Sign In to Review')}</span>
            </a>
          )}
        </div>
      </div>

      {/* Top Overview Scorecard & 5-Star Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 rounded-3xl bg-vault-900 border border-slate-800">
        {/* Left: Overall Big Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
          <div className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight">
            {stats.totalReviews > 0 ? (
              <>
                {stats.averageRating.toFixed(1)}
                <span className="text-xl sm:text-2xl text-slate-500 font-semibold"> / 5.0</span>
              </>
            ) : (
              <span className="text-3xl sm:text-4xl text-slate-400 font-bold">
                {t('reviews.noReviewsWord', null, 'Không')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(stats.averageRating) && stats.totalReviews > 0
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p>
              {stats.totalReviews > 0
                ? t('reviews.ratingScore', { score: stats.averageRating.toFixed(1) }, `Based on ${stats.totalReviews} collector reviews`)
                : t('reviews.noReviewsWord', null, 'Không')}
            </p>
            {stats.verifiedCount > 0 && (
              <p className="flex items-center justify-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{stats.verifiedCount} {t('reviews.verifiedPurchase', null, 'Verified Purchases')}</span>
              </p>
            )}
          </div>
        </div>

        {/* Middle: 5-Star Distribution Interactive Bars */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution?.[star] || 0;
            const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            const isActive = ratingFilter === String(star);

            return (
              <button
                key={star}
                onClick={() => handleRatingFilterChange(isActive ? 'all' : String(star))}
                className={`w-full group flex items-center gap-3 p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-1 w-12 text-xs font-semibold text-slate-300 shrink-0">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>

                {/* Progress bar */}
                <div className="flex-1 h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-16 text-right text-xs text-slate-400 shrink-0">
                  <span className="font-semibold text-slate-300">{count}</span>
                  <span className="text-[10px] text-slate-500 ml-1">({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Category Criteria Average Scores */}
        <div className="md:col-span-3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            {t('reviews.collectorCriteria', null, 'Category Insights')}
          </span>

          {Object.keys(stats.criteriaAverages || {}).length > 0 ? (
            Object.entries(stats.criteriaAverages).map(([name, data]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[130px]">
                  {getCriterionLabel(name, currentLanguage)}
                </span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  {data.avgRating.toFixed(1)} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">
              {t('reviews.beFirst', null, 'Be the first collector to provide detailed criteria ratings!')}
            </p>
          )}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-vault-900 border border-slate-800">
        {/* Star Rating Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleRatingFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              ratingFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {t('reviews.allRatings', null, 'All')} ({stats.totalReviews})
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => handleRatingFilterChange(String(s))}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                ratingFilter === String(s)
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{s}</span>
              <Star
                className={`w-3 h-3 ${
                  ratingFilter === String(s) ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-400'
                }`}
              />
              <span className="text-[10px] opacity-75">({stats.distribution?.[s] || 0})</span>
            </button>
          ))}
        </div>

        {/* Toggles and Sorting Dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Photos only toggle */}
          <button
            onClick={handleTogglePhotosOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              hasImagesFilter
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t('reviews.withPhotos', null, 'With Photos')}</span>
            {stats.withImagesCount > 0 && (
              <span className="text-[10px] text-slate-500">({stats.withImagesCount})</span>
            )}
          </button>

          {/* Verified purchase only toggle */}
          <button
            onClick={handleToggleVerifiedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isVerifiedFilter
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('reviews.verifiedOnly', null, 'Verified Only')}</span>
            {stats.verifiedCount > 0 && (
              <span className="text-[10px] text-slate-500">({stats.verifiedCount})</span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer py-1"
            >
              <option value="newest" className="bg-slate-900 text-white">
                {t('reviews.sortNewest', null, 'Newest First')}
              </option>
              <option value="highest" className="bg-slate-900 text-white">
                {t('reviews.sortHighest', null, 'Highest Rating')}
              </option>
              <option value="lowest" className="bg-slate-900 text-white">
                {t('reviews.sortLowest', null, 'Lowest Rating')}
              </option>
              <option value="helpful" className="bg-slate-900 text-white">
                {t('reviews.sortHelpful', null, 'Most Helpful')}
              </option>
              <option value="oldest" className="bg-slate-900 text-white">
                {t('reviews.sortOldest', null, 'Oldest First')}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-vault-900/50 rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-400">{t('common.loading', null, 'Loading collector reviews...')}</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <ReviewCard
              key={rev._id}
              review={rev}
              onVote={handleVote}
              onEdit={() => setIsFormModalOpen(true)}
              onDelete={handleDeleteReview}
              onOpenImage={handleOpenLightbox}
            />
          ))}

          {/* Pagination controls if more than 1 page */}
          {pagination.pages > 1 && (
            <div className="pt-4 flex items-center justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    p === currentPage
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-vault-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-vault-900/60 border border-slate-800/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              {t('reviews.noReviewsYet', null, 'No Reviews Found')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              {ratingFilter !== 'all' || hasImagesFilter || isVerifiedFilter
                ? 'No collector reviews match your selected filter criteria. Try resetting filters.'
                : t('reviews.beFirst', null, 'Be the first collector to review this item!')}
            </p>
          </div>
          {isAuthenticated && !userReview && (
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
            >
              {t('reviews.writeReview', null, 'Write a Review')}
            </button>
          )}
        </div>
      )}

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        product={product}
        existingReview={userReview}
        onSuccess={fetchReviews}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={handleCloseLightbox}
        images={lightboxState.images}
        currentIndex={lightboxState.currentIndex}
        setCurrentIndex={(fnOrVal) =>
          setLightboxState((prev) => ({
            ...prev,
            currentIndex: typeof fnOrVal === 'function' ? fnOrVal(prev.currentIndex) : fnOrVal,
          }))
        }
      />
    </section>
  );
};

export default ReviewSection;
