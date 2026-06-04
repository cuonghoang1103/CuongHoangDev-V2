'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Eye,
  Edit3,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Minus,
  Heading2,
  Code,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ToolbarAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const TOOLBAR_ACTIONS: ToolbarAction[][] = [
  [
    { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
    { icon: Italic, label: 'Italic', prefix: '_', suffix: '_' },
    { icon: Code, label: 'Code', prefix: '`', suffix: '`' },
    { icon: Link2, label: 'Link', prefix: '[', suffix: '](url)' },
  ],
  [
    { icon: Heading2, label: 'Heading', prefix: '## ', suffix: '', block: true },
    { icon: Quote, label: 'Quote', prefix: '> ', suffix: '', block: true },
    { icon: Minus, label: 'Divider', prefix: '\n---\n', suffix: '', block: true },
    { icon: List, label: 'List', prefix: '- ', suffix: '', block: true },
    { icon: ListOrdered, label: 'Numbered', prefix: '1. ', suffix: '', block: true },
  ],
];

function applyFormat(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  block: boolean
): string {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  const selected = value.slice(start, end);

  if (block && selected) {
    const lines = selected.split('\n').map((l) => prefix + l);
    return value.slice(0, start) + lines.join('\n') + value.slice(end);
  }

  if (selected) {
    return value.slice(0, start) + prefix + selected + suffix + value.slice(end);
  }

  const cursor = start + prefix.length;
  return value.slice(0, start) + prefix + suffix + value.slice(end);
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Viết case study, hành trình phát triển dự án...\n\n## Giai đoạn 1\n- Mô tả công việc\n\n**Bold** cho emphasis, [Link](url) cho tài liệu tham khảo.',
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyAction = useCallback(
    (action: ToolbarAction) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const newValue = applyFormat(ta, action.prefix, action.suffix, action.block ?? false);
      onChange(newValue);
      ta.focus();
    },
    [onChange]
  );

  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    border: 'rgba(168,85,247,0.25)',
    borderFocus: 'rgba(168,85,247,0.5)',
    bg: '#12121a',
    surface: '#1a1a24',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  };

  const labelClass = 'text-xs font-medium';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        Case Study / Nội dung dự án
      </label>

      {/* Container */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{
          borderColor: c.border,
          background: c.bg,
          boxShadow: `0 0 0 1px ${c.border}`,
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b gap-4 flex-wrap"
          style={{ borderColor: `${c.border}` }}
        >
          {/* Formatting buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            {TOOLBAR_ACTIONS[0].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => applyAction(action)}
                title={action.label}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{
                  color: c.textMuted,
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = c.primary;
                  (e.currentTarget as HTMLElement).style.background = `${c.primary}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = c.textMuted;
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <action.icon className="w-3.5 h-3.5" />
              </button>
            ))}

            <div className="w-px h-4 mx-1" style={{ background: `${c.border}` }} />

            {TOOLBAR_ACTIONS[1].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => applyAction(action)}
                title={action.label}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{ color: c.textMuted }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = c.primary;
                  (e.currentTarget as HTMLElement).style.background = `${c.primary}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = c.textMuted;
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <action.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Mode switcher */}
          <div
            className="flex items-center rounded-lg p-0.5 gap-0.5"
            style={{ background: c.surface }}
          >
            {([
              { id: 'edit', label: 'Viết', icon: Edit3 },
              { id: 'split', label: 'Song song', icon: null },
              { id: 'preview', label: 'Xem', icon: Eye },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: mode === id ? `linear-gradient(135deg, ${c.primary}30, ${c.secondary}20)` : 'transparent',
                  color: mode === id ? c.primary : c.textMuted,
                  border: mode === id ? `1px solid ${c.borderFocus}` : '1px solid transparent',
                }}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor / Preview Area */}
        <div className={`flex ${mode === 'split' ? 'divide-x' : ''}`} style={{ minHeight: '320px' }}>
          {/* Edit pane */}
          {(mode === 'edit' || mode === 'split') && (
            <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} relative`}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-full p-4 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none leading-relaxed"
                style={{ minHeight: '320px' }}
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview pane */}
          {(mode === 'preview' || mode === 'split') && (
            <div
              className={`${mode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto p-5`}
              style={{ maxHeight: '400px' }}
            >
              {value ? (
                <div className="prose-markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-text-primary mb-3 mt-6" style={{ color: c.text }}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-text-primary mb-3 mt-5 flex items-center gap-2">
                          <span
                            className="w-1 h-5 rounded-full shrink-0"
                            style={{ background: `linear-gradient(180deg, ${c.primary}, ${c.secondary})` }}
                          />
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-text-primary mb-2 mt-4 flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full shrink-0" style={{ background: c.primary }} />
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-text-secondary leading-relaxed mb-3">{children}</p>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-neon-violet font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-neon-indigo">{children}</em>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-1.5 mb-3 ml-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="space-y-1.5 mb-3 ml-2 list-none">{children}</ol>
                      ),
                      li: ({ children, ...props }) => {
                        const ol = (props as { ol?: boolean }).ol;
                        if (ol) {
                          return (
                            <li className="flex items-start gap-2.5 text-sm text-text-secondary">
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                                style={{
                                  background: `${c.primary}15`,
                                  border: `1px solid ${c.primary}40`,
                                  color: c.primary,
                                }}
                              >
                                {(props as { index?: number }).index !== undefined
                                  ? (props as { index: number }).index + 1
                                  : '•'}
                              </span>
                              <span className="flex-1">{children}</span>
                            </li>
                          );
                        }
                        return (
                          <li className="flex items-start gap-2.5 text-sm text-text-secondary">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0"
                              style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }}
                            />
                            {children}
                          </li>
                        );
                      },
                      blockquote: ({ children }) => (
                        <blockquote
                          className="border-l-4 rounded-r-lg pl-4 py-2 my-3"
                          style={{
                            borderColor: `${c.primary}80`,
                            background: `${c.primary}08`,
                          }}
                        >
                          <span className="text-sm text-text-secondary italic">{children}</span>
                        </blockquote>
                      ),
                      hr: () => (
                        <hr
                          className="my-5 border-0 h-px"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${c.border}, transparent)`,
                          }}
                        />
                      ),
                      code: ({ children, className }) => {
                        const isBlock = className?.startsWith('language-');
                        if (isBlock) {
                          return (
                            <pre
                              className="rounded-lg p-4 my-3 overflow-x-auto text-xs"
                              style={{
                                background: '#0d0d14',
                                border: `1px solid ${c.border}`,
                                color: '#c4b5fd',
                              }}
                            >
                              <code>{children}</code>
                            </pre>
                          );
                        }
                        return (
                          <code
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: `${c.primary}15`,
                              color: c.primary,
                            }}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ minHeight: '280px' }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: `${c.primary}10` }}
                  >
                    <Eye className="w-7 h-7" style={{ color: c.primary, opacity: 0.5 }} />
                  </div>
                  <p className="text-sm text-text-muted">Xem trước nội dung case study</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Hỗ trợ Markdown: **bold**, _italic_, [Liên kết](url), ## Tiêu đề, - Danh sách, &gt; Trích dẫn
      </p>
    </div>
  );
}
