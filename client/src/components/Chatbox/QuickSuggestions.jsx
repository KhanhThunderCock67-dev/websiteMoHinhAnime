import React from 'react';
import { Sparkles, Flame, Shield, Dices, Tag } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Flame,
    label: 'Sản phẩm bán chạy nhất',
    query: 'Gợi ý cho tôi các sản phẩm bán chạy và được đánh giá cao nhất shop!',
  },
  {
    icon: Sparkles,
    label: 'Figure Anime nổi bật',
    query: 'Tư vấn giúp tôi các mẫu figure Anime và Nendoroid đẹp nhất đang có sẵn.',
  },
  {
    icon: Shield,
    label: 'Warhammer cho người mới',
    query: 'Tôi mới tìm hiểu Warhammer 40k, shop có combo miniatures nào phù hợp để bắt đầu?',
  },
  {
    icon: Dices,
    label: 'Board Game cho 3-4 người',
    query: 'Gợi ý các tựa boardgame hay, độ khó vừa phải cho nhóm 3-4 người chơi cuối tuần.',
  },
  {
    icon: Tag,
    label: 'Sản phẩm Sale dưới $60',
    query: 'Shop có sản phẩm nào đang giảm giá hoặc có giá dưới $60 không?',
  },
];

export const QuickSuggestions = ({ onSelect, disabled }) => {
  return (
    <div className="p-3 bg-vault-950/40 border-t border-slate-800/60">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Gợi ý câu hỏi nhanh:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelect(item.query)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-vault-900/90 hover:bg-vault-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-all text-left shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Icon className="w-3 h-3 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickSuggestions;
