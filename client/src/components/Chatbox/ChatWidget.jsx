import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot, Sparkles, X } from 'lucide-react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import QuickSuggestions from './QuickSuggestions';
import ChatInput from './ChatInput';
import { chatApi } from '../../api';

const STORAGE_KEY = 'hobby_vault_chat_history';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Sync with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat to sessionStorage:', e);
    }
  }, [messages]);

  // Clear unread indicator when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  const handleSend = async (userText) => {
    if (!userText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare payload for backend (strip timestamps/extra props)
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatApi.sendMessage(payloadMessages);

      if (res?.data?.success) {
        const assistantMessage = {
          role: 'assistant',
          content: res.data.data.reply,
          matchedProducts: res.data.data.matchedProducts || [],
          source: res.data.data.source,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (!isOpen) {
          setHasUnread(true);
        }
      } else {
        throw new Error(res?.data?.message || 'Không thể nhận phản hồi từ AI');
      }
    } catch (err) {
      console.error('[Chat Error]:', err);
      const errorMessage = {
        role: 'assistant',
        content:
          err.response?.data?.message ||
          'Xin lỗi, hiện tại hệ thống tư vấn đang bận hoặc gặp sự cố kết nối. Bạn vui lòng thử lại sau giây lát!',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch sử trò chuyện và bắt đầu lại?')) {
      setMessages([]);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] sm:w-[420px] h-[580px] max-h-[82vh] rounded-2xl bg-vault-900 border border-slate-700/80 shadow-2xl shadow-black/80 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <ChatHeader
            onClose={() => setIsOpen(false)}
            onMinimize={() => setIsOpen(false)}
            onReset={handleReset}
            messageCount={messages.length}
          />

          <ChatMessageList messages={messages} isLoading={isLoading} />

          {/* Quick prompt chips shown when few messages */}
          {messages.length <= 4 && (
            <QuickSuggestions onSelect={handleSend} disabled={isLoading} />
          )}

          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative group flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-semibold shadow-xl transition-all duration-300 transform active:scale-95 ${
          isOpen
            ? 'bg-vault-800 hover:bg-vault-700 border border-slate-700 text-slate-300'
            : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-500 glow-amber border border-amber-400/40 text-vault-950 font-bold'
        }`}
        aria-label="Toggle AI Product Consultation Chat"
      >
        {isOpen ? (
          <>
            <X className="w-5 h-5 text-slate-300" />
            <span className="text-xs font-medium">Đóng chat</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Bot className="w-5 h-5 text-vault-950 group-hover:rotate-12 transition-transform duration-300" />
              {/* Unread badge or pulsating spark */}
              {hasUnread ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white animate-ping" />
              ) : null}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight font-['Outfit']">Tư vấn AI</span>
              <span className="text-[10px] opacity-80 font-normal leading-none">Hỏi HobbyBot</span>
            </div>
            <Sparkles className="w-4 h-4 text-vault-950 animate-pulse" />
          </>
        )}

        {/* Floating tooltip when closed & has no unread */}
        {!isOpen && !hasUnread && (
          <span className="absolute -top-10 right-0 whitespace-nowrap bg-vault-900 text-amber-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Cần tư vấn mô hình & game? Bấm để hỏi!
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
