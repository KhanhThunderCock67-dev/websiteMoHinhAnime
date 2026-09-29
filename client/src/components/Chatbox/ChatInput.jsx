import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export const ChatInput = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto focus when mounted
  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;

    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    // Auto-grow textarea up to 100px
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-vault-900 border-t border-slate-800">
      <div className="relative flex items-center bg-vault-950/90 rounded-2xl border border-slate-700/80 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all p-1.5 shadow-inner">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi HobbyBot (vd: figure Saber, boardgame 4 người)..."
          disabled={isLoading}
          className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 resize-none outline-none leading-relaxed disabled:opacity-50 max-h-[100px]"
        />

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-amber-600 text-vault-950 font-bold flex items-center justify-center transition-all shadow-md shadow-amber-500/20 disabled:shadow-none mr-0.5"
          title="Gửi tin nhắn (Enter)"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-vault-950" />
          ) : (
            <Send className="w-4 h-4 text-vault-950 translate-x-px" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-500">
        <span>Nhấn <kbd className="px-1 py-0.2 bg-vault-800 rounded text-slate-400 font-mono">Enter</kbd> để gửi, <kbd className="px-1 py-0.2 bg-vault-800 rounded text-slate-400 font-mono">Shift + Enter</kbd> xuống dòng</span>
      </div>
    </form>
  );
};

export default ChatInput;
