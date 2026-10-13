export const CATEGORY_CRITERIA_MAP = {
  'anime-figures': [
    { key: 'detailQuality', name: 'Detail Quality', labelEn: 'Detail Quality', labelVi: 'Độ chi tiết mô hình' },
    { key: 'paintQuality', name: 'Paint Quality', labelEn: 'Paint Quality', labelVi: 'Chất lượng màu sơn' },
    { key: 'materialQuality', name: 'Material Quality', labelEn: 'Material Quality', labelVi: 'Chất liệu' },
    { key: 'packaging', name: 'Packaging', labelEn: 'Packaging', labelVi: 'Chất lượng đóng gói' },
    { key: 'overallSatisfaction', name: 'Overall Satisfaction', labelEn: 'Overall Satisfaction', labelVi: 'Mức độ hài lòng tổng thể' },
  ],
  'warhammer-40k': [
    { key: 'miniatureDetail', name: 'Miniature Detail', labelEn: 'Miniature Detail', labelVi: 'Độ chi tiết miniature' },
    { key: 'componentQuality', name: 'Component Quality', labelEn: 'Component Quality', labelVi: 'Chất lượng linh kiện' },
    { key: 'boxCondition', name: 'Box Condition', labelEn: 'Box Condition', labelVi: 'Tình trạng hộp' },
    { key: 'completeness', name: 'Completeness', labelEn: 'Completeness', labelVi: 'Độ đầy đủ của sản phẩm' },
    { key: 'overallSatisfaction', name: 'Overall Satisfaction', labelEn: 'Overall Satisfaction', labelVi: 'Mức độ hài lòng tổng thể' },
  ],
  'board-games': [
    { key: 'componentQuality', name: 'Component Quality', labelEn: 'Component Quality', labelVi: 'Chất lượng thành phần' },
    { key: 'artworkDesign', name: 'Artwork & Design', labelEn: 'Artwork & Design', labelVi: 'Thiết kế hình ảnh' },
    { key: 'rulebookQuality', name: 'Rulebook Quality', labelEn: 'Rulebook Quality', labelVi: 'Chất lượng sách hướng dẫn' },
    { key: 'packaging', name: 'Packaging', labelEn: 'Packaging', labelVi: 'Chất lượng đóng hộp' },
    { key: 'overallSatisfaction', name: 'Overall Satisfaction', labelEn: 'Overall Satisfaction', labelVi: 'Mức độ hài lòng tổng thể' },
  ],
};

export const getCriteriaForCategory = (categorySlug) => {
  if (!categorySlug) return [];
  const normalized = categorySlug.toLowerCase().trim();
  return CATEGORY_CRITERIA_MAP[normalized] || [];
};

export const getCriterionLabel = (criterionName, lang = 'en') => {
  for (const list of Object.values(CATEGORY_CRITERIA_MAP)) {
    const found = list.find((item) => item.name.toLowerCase() === (criterionName || '').toLowerCase());
    if (found) {
      return lang === 'vi' ? found.labelVi : found.labelEn;
    }
  }
  return criterionName;
};
