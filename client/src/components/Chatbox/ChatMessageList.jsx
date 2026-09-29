import React, { useEffect, useRef } from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import ChatMarkdown from './ChatMarkdown';
import ProductPreviewCard from './ProductPreviewCard';

export const ChatMessageList = ({ messages, isLoading }) => {
  const bottomRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Welcome Screen if empty */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-6 px-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center mb-3 shadow-xl shadow-amber-500/10">
            <Bot className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-slate-100 font-['Outfit'] mb-1">
            Xin chào! Tôi là HobbyBot 🤖
          </h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
            Trợ lý AI am hiểu mọi bộ sưu tập figure, Warhammer 40k và Board game tại <span className="text-amber-400 font-semibold">Hobby Vault</span>.
          </p>

          <div className="w-full bg-vault-900/60 rounded-xl p-3 border border-slate-800 text-left space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>HobbyBot có thể giúp bạn:</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc marker:text-amber-400">
              <li>Tìm kiếm nhân vật Anime, scale figures & Nendoroid</li>
              <li>Tư vấn phe phái, đội hình Warhammer 40k cho tân thủ</li>
              <li>Gợi ý Board game phù hợp với số lượng người chơi</li>
              <li>Kiểm tra tình trạng hàng tồn kho và các deal giảm giá</li>
            </ul>
          </div>
        </div>
      )}

      {/* Message History */}
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const formattedTime = msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        return (
          <div
            key={index}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                isUser
                  ? 'bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/20'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm ${
                isUser
                  ? 'bg-amber-500/15 border border-amber-500/30 text-slate-100 rounded-tr-none'
                  : 'bg-vault-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <ChatMarkdown content={msg.content} />
              )}

              {/* Matched Products Cards Carousel */}
              {!isUser && msg.matchedProducts && msg.matchedProducts.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Sản phẩm gợi ý liên quan ({msg.matchedProducts.length}):</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {msg.matchedProducts.map((p) => (
                      <ProductPreviewCard key={p.id || p.slug} product={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              {formattedTime && (
                <div
                  className={`mt-1 text-[10px] text-slate-500 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {formattedTime}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading typing indicator */}
      {isLoading && (
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div className="rounded-2xl rounded-tl-none p-3.5 bg-vault-900/90 border border-slate-800 flex items-center gap-1.5 shadow-md">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-xs text-slate-400 ml-2 font-medium">HobbyBot đang tra cứu dữ liệu...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessageList;
