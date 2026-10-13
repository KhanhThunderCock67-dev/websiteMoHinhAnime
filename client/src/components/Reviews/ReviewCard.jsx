import React, { useState } from 'react';
import { Star, ThumbsUp, ShieldCheck, Edit3, Trash2, Camera, Calendar } from 'lucide-react';
import { useTranslation, useLocaleStore } from '../../store/localeStore';
import { useAuthStore } from '../../store/authStore';
import { getCriterionLabel } from '../../utils/reviewCriteria';

export const ReviewCard = ({
  review,
  onVote,
  onEdit,
  onDelete,
  onOpenImage,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLocaleStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isVoting, setIsVoting] = useState(false);

  const isOwnReview = review.isOwnReview || (user && review.user?._id === user._id);

  const handleVoteClick = async () => {
    if (!isAuthenticated) {
      alert(t('reviews.loginToVote', null, 'Please sign in to vote'));
      return;
    }
    if (isOwnReview) {
      alert(t('reviews.cannotVoteOwn', null, 'You cannot vote on your own review'));
      return;
    }
    try {
      setIsVoting(true);
      await onVote(review._id);
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const authorName = review.user?.name || 'Collector';
  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-vault-900 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 space-y-4">
      {/* Top Header: Author & Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Author info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-amber-400">
                {authorInitials}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-display">
                {authorName}
              </span>
              {review.isVerifiedPurchase && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  title={t('reviews.verifiedBadgeDesc', null, 'Verified buyer with a completed delivery')}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {t('reviews.verifiedPurchase', null, 'Verified Purchase')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(review.createdAt)}</span>
              {review.updatedAt && review.updatedAt !== review.createdAt && (
                <span className="text-slate-600">({t('common.edit', null, 'Edited')})</span>
              )}
            </div>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-4 h-4 ${
                s <= review.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-700'
              }`}
            />
          ))}
          <span className="ml-1.5 text-xs font-extrabold text-slate-200">
            {review.rating}.0
          </span>
        </div>
      </div>

      {/* Domain Criteria Breakdown (if provided) */}
      {review.criteria && review.criteria.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {review.criteria.map((c, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]"
            >
              <span className="text-slate-400">
                {getCriterionLabel(c.name, currentLanguage)}:
              </span>
              <span className="font-bold text-amber-400 flex items-center gap-0.5">
                {c.rating} <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Review Comment Text */}
      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
        {review.comment}
      </p>

      {/* Uploaded Photos Gallery */}
      {review.images && review.images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {t('reviews.photosCount', { count: review.images.length }, `${review.images.length} Real Photos`)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {review.images.map((img, imgIdx) => (
              <button
                key={imgIdx}
                type="button"
                onClick={() => onOpenImage && onOpenImage(review.images, imgIdx)}
                className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-amber-400/80 transition-all cursor-zoom-in"
              >
                <img
                  src={img}
                  alt={`Review attachment ${imgIdx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Footer: Helpful button & Author actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
        {/* Helpful vote */}
        <button
          onClick={handleVoteClick}
          disabled={isVoting}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
            review.hasVoted
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs'
              : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
          }`}
          title={
            isOwnReview
              ? t('reviews.cannotVoteOwn', null, 'Cannot vote on own review')
              : t('reviews.helpful', null, 'Helpful')
          }
        >
          <ThumbsUp
            className={`w-3.5 h-3.5 ${
              review.hasVoted ? 'fill-amber-400 text-amber-400' : ''
            }`}
          />
          <span className="font-semibold">{t('reviews.helpful', null, 'Helpful')}</span>
          {review.helpfulCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-amber-300 font-bold ml-0.5">
              {review.helpfulCount}
            </span>
          )}
        </button>

        {/* Owner actions: Edit & Delete */}
        {isOwnReview && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit && onEdit(review)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('common.edit', null, 'Edit')}</span>
            </button>
            <button
              onClick={() => onDelete && onDelete(review._id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('common.delete', null, 'Delete')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
