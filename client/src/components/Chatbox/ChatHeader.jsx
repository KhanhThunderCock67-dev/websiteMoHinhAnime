import React from 'react';
import { Bot, RotateCcw, X, Minus, Sparkles } from 'lucide-react';

export const ChatHeader = ({ onReset, onClose, onMinimize, messageCount = 0 }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-vault-900 via-vault-850 to-vault-900 border-b border-slate-800 select-none">
      {/* Bot Identity */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
            <Bot className="w-5 h-5" />
          </div>
          {/* Live pulsing status dot */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-vault-900"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">HobbyBot</h3>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Trợ lý tư vấn sản phẩm 24/7</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        {messageCount > 0 && (
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-vault-800 transition-colors"
            title="Bắt đầu lại hội thoại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onMinimize}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-vault-800 transition-colors"
          title="Thu nhỏ"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-vault-800 transition-colors"
          title="Đóng chatbox"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
