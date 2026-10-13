import React, { useState, useEffect } from 'react';
import { Star, X, UploadCloud, AlertCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useTranslation, useLocaleStore } from '../../store/localeStore';
import { reviewApi } from '../../api';
import { getCriteriaForCategory, getCriterionLabel } from '../../utils/reviewCriteria';

export const ReviewFormModal = ({
  isOpen,
  onClose,
  product,
  existingReview = null,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLocaleStore();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [criteriaRatings, setCriteriaRatings] = useState({});
  const [images, setImages] = useState([]); // Array of existing/uploaded URLs
  const [newFiles, setNewFiles] = useState([]); // File objects waiting to upload
  const [previewUrls, setPreviewUrls] = useState([]); // Blob preview URLs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categoryCriteria = getCriteriaForCategory(product?.categorySlug);

  const ratingLabelsEn = {
    1: 'Poor / Defective',
    2: 'Fair / Below Expectation',
    3: 'Average / Acceptable',
    4: 'Very Good / High Quality',
    5: 'Masterpiece / Exceptional',
  };

  const ratingLabelsVi = {
    1: 'Kém / Có lỗi',
    2: 'Dưới kỳ vọng',
    3: 'Bình thường / Ổn',
    4: 'Rất tốt / Đẹp',
    5: 'Tuyệt tác / Hoàn hảo',
  };

  const ratingLabels = currentLanguage === 'vi' ? ratingLabelsVi : ratingLabelsEn;

  // Initialize form state
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || '');
      setImages(existingReview.images || []);

      const critMap = {};
      (existingReview.criteria || []).forEach((c) => {
        critMap[c.name] = c.rating;
      });
      setCriteriaRatings(critMap);
    } else {
      setRating(5);
      setComment('');
      setImages([]);
      setCriteriaRatings({});
    }
    setNewFiles([]);
    setPreviewUrls([]);
    setErrorMessage('');
  }, [existingReview, isOpen]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (!isOpen) return null;

  const handleSubCriteriaChange = (name, score) => {
    setCriteriaRatings((prev) => ({
      ...prev,
      [name]: score,
    }));
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const totalCount = images.length + newFiles.length + selected.length;
    if (totalCount > 5) {
      setErrorMessage(t('reviews.uploadHint', null, 'You can upload at most 5 images'));
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit: ' + file.name);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setNewFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    setErrorMessage('');
    e.target.value = ''; // Reset input
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewFile = (indexToRemove) => {
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setNewFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage(t('reviews.reviewComment', null, 'Review comment is required'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let finalImages = [...images];

      // Upload any newly selected files
      if (newFiles.length > 0) {
        const uploadRes = await reviewApi.uploadImages(newFiles);
        if (uploadRes.data?.data?.urls) {
          finalImages = [...finalImages, ...uploadRes.data.data.urls];
        }
      }

      // Format criteria
      const formattedCriteria = Object.entries(criteriaRatings)
        .filter(([_, score]) => score >= 1 && score <= 5)
        .map(([name, score]) => ({
          name,
          rating: Number(score),
        }));

      const payload = {
        productId: product._id,
        rating: Number(rating),
        comment: comment.trim(),
        images: finalImages.slice(0, 5),
        criteria: formattedCriteria,
      };

      if (existingReview) {
        await reviewApi.update(existingReview._id, payload);
      } else {
        await reviewApi.createOrUpdate(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save review:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to submit review'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-vault-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {existingReview
                ? t('reviews.editReview', null, 'Edit Your Review')
                : t('reviews.writeReview', null, 'Write a Review')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {product?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall 1-5 Star Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              {t('reviews.overallRating', null, 'Overall Rating')} <span className="text-amber-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-amber-400 ml-2">
                {ratingLabels[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Category-Specific Criteria Stars */}
          {categoryCriteria.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t('reviews.collectorCriteria', null, 'Specialized Category Criteria')}
                </span>
                <span className="text-[11px] text-slate-500 italic">
                  (Optional)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {categoryCriteria.map((crit) => {
                  const currentScore = criteriaRatings[crit.name] || 0;
                  return (
                    <div
                      key={crit.key}
                      className="flex items-center justify-between p-2 rounded-xl bg-vault-900 border border-slate-800/80 text-xs"
                    >
                      <span className="text-slate-300 truncate max-w-[140px]">
                        {currentLanguage === 'vi' ? crit.labelVi : crit.labelEn}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              handleSubCriteriaChange(
                                crit.name,
                                currentScore === s ? 0 : s
                              )
                            }
                            className="p-0.5 hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                s <= currentScore
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment text area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                {t('reviews.reviewComment', null, 'Review Comment')} <span className="text-amber-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {comment.length} / 2000
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={2000}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t(
                'reviews.commentPlaceholder',
                null,
                'Share your experience: sculpt details, paint quality, box condition, or gameplay balance...'
              )}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
            />
          </div>

          {/* Real Photos Uploader */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              {t('reviews.uploadPhotos', null, 'Upload Real Photos')} ({images.length + newFiles.length}/5)
            </label>

            {/* Previews grid */}
            {(images.length > 0 || previewUrls.length > 0) && (
              <div className="flex flex-wrap gap-2.5 mb-2">
                {/* Existing uploaded images */}
                {images.map((url, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 group"
                  >
                    <img
                      src={url}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/90 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Newly selected files */}
                {previewUrls.map((url, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-amber-500/50 group"
                  >
                    <img
                      src={url}
                      alt="New selection"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/90 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop / Select zone if under 5 images */}
            {images.length + newFiles.length < 5 && (
              <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/40 hover:bg-slate-950/70 transition-all cursor-pointer">
                <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-300">
                  {t('reviews.uploadPhotos', null, 'Click or drag photos here')}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {t('reviews.uploadHint', null, 'JPEG, PNG, WebP up to 5MB each (Max 5 photos)')}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              {t('common.cancel', null, 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.loading', null, 'Submitting...')}</span>
                </>
              ) : (
                <span>
                  {existingReview
                    ? t('reviews.updateReview', null, 'Update Review')
                    : t('reviews.submitReview', null, 'Submit Review')}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;
