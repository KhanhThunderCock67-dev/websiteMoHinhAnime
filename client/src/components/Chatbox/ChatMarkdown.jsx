import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Tag } from 'lucide-react';

/**
 * Custom lightweight Markdown parser & renderer
 * Handles headers, bold, italics, code, bullet lists, product links, and price tags.
 * Works natively without requiring external npm packages!
 */
export const ChatMarkdown = ({ content = '' }) => {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
              <span className="text-amber-400 mt-1 select-none text-xs">▸</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInline = (text) => {
    if (!text) return null;

    // Pattern to match links [label](url), bold **bold**, code `code`, and prices $XX.XX
    const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\$\d+(?:\.\d{2})?)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Link [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        const isInternal = url.startsWith('/') || url.startsWith('#');

        if (isInternal) {
          return (
            <Link
              key={index}
              to={url}
              className="inline-flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2 decoration-amber-400/40 hover:decoration-amber-300 transition-colors mx-1"
            >
              <span>{linkText}</span>
            </Link>
          );
        }

        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors mx-1"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }

      // Bold **text**
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={index} className="font-semibold text-amber-300">
            {boldMatch[1]}
          </strong>
        );
      }

      // Code `code`
      const codeMatch = part.match(/^`([^`]+)`$/);
      if (codeMatch) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-vault-950 border border-slate-700/60 font-mono text-[11px] text-cyan-300 mx-0.5"
          >
            {codeMatch[1]}
          </code>
        );
      }

      // Price highlight $XX.XX
      const priceMatch = part.match(/^\$(\d+(?:\.\d{2})?)$/);
      if (priceMatch) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-0.5 font-bold font-['Outfit'] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 text-xs sm:text-sm mx-0.5"
          >
            <Tag className="w-3 h-3" />
            ${priceMatch[1]}
          </span>
        );
      }

      return part;
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Check horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      flushList();
      elements.push(<hr key={`hr-${lineIdx}`} className="my-3 border-slate-800" />);
      return;
    }

    // Check headings
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${lineIdx}`} className="text-sm sm:text-base font-bold text-amber-400 mt-2.5 mb-1 font-['Outfit']">
          {parseInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${lineIdx}`} className="text-base sm:text-lg font-bold text-white mt-3 mb-1 font-['Outfit']">
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${lineIdx}`} className="text-lg sm:text-xl font-extrabold text-amber-400 mt-3 mb-1.5 font-['Outfit']">
          {parseInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Check bullet list item
    const listMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (listMatch) {
      currentList.push(listMatch[1]);
      return;
    }

    // Numbered list item
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushList();
      elements.push(
        <div key={`num-${lineIdx}`} className="flex items-start gap-2 my-1 pl-1 text-xs sm:text-sm text-slate-200">
          <span className="font-semibold text-amber-400 text-xs mt-0.5">{numberedMatch[1]}.</span>
          <span className="flex-1">{parseInline(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${lineIdx}`} className="h-2" />);
      return;
    }

    // Standard paragraph
    flushList();
    elements.push(
      <p key={`p-${lineIdx}`} className="my-1 text-xs sm:text-sm text-slate-200 leading-relaxed">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
};

export default ChatMarkdown;
