/**
 * Review criteria definitions tailored to domain categories
 */
const CATEGORY_CRITERIA = {
  'anime-figures': [
    { key: 'detailQuality', labelEn: 'Detail Quality', labelVi: 'Độ chi tiết mô hình' },
    { key: 'paintQuality', labelEn: 'Paint Quality', labelVi: 'Chất lượng màu sơn' },
    { key: 'materialQuality', labelEn: 'Material Quality', labelVi: 'Chất liệu' },
    { key: 'packaging', labelEn: 'Packaging', labelVi: 'Chất lượng đóng gói' },
    { key: 'overallSatisfaction', labelEn: 'Overall Satisfaction', labelVi: 'Mức độ hài lòng tổng thể' },
  ],
  'warhammer-40k': [
    { key: 'miniatureDetail', labelEn: 'Miniature Detail', labelVi: 'Độ chi tiết miniature' },
    { key: 'componentQuality', labelEn: 'Component Quality', labelVi: 'Chất lượng linh kiện' },
    { key: 'boxCondition', labelEn: 'Box Condition', labelVi: 'Tình trạng hộp' },
    { key: 'completeness', labelEn: 'Completeness', labelVi: 'Độ đầy đủ của sản phẩm' },
    { key: 'overallSatisfaction', labelEn: 'Overall Satisfaction', labelVi: 'Mức độ hài lòng tổng thể' },
  ],
  'board-games': [
    { key: 'componentQuality', labelEn: 'Component Quality', labelVi: 'Chất lượng thành phần' },
    { key: 'artworkDesign', labelEn: 'Artwork & Design', labelVi: 'Thiết kế hình ảnh' },
    { key: 'rulebookQuality', labelEn: 'Rulebook Quality', labelVi: 'Chất lượng sách hướng dẫn' },
    { key: 'packaging', labelEn: 'Packaging', labelVi: 'Chất lượng đóng hộp' },
    { key: 'overallSatisfaction', labelEn: 'Overall Satisfaction', labelVi: 'Mức độ hài lòng tổng thể' },
  ],
};

const getCriteriaForCategory = (categorySlug) => {
  if (!categorySlug) return [];
  const normalized = categorySlug.toLowerCase().trim();
  return CATEGORY_CRITERIA[normalized] || [];
};

module.exports = {
  CATEGORY_CRITERIA,
  getCriteriaForCategory,
};
