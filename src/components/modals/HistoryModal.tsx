import { BookOpen, PenTool, ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { CityDetails } from '../../types/index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  city: CityDetails;
  openSuggestion?: () => void;
  customText?: string;
}

const TITLE_CLASS =
  'text-amber-500 font-display font-bold text-xl md:text-2xl mt-6 mb-3 leading-tight tracking-wide uppercase border-b border-amber-500/20 pb-2';
const PARAGRAPH_CLASS = 'text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4';

/** Grassetto Markdown `**testo**` → nodi React (testo, non HTML). */
const renderInlineBold = (text: string): ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  let boldOccurrence = 0;
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldText = part.slice(2, -2);
      const key = `b-${boldOccurrence}`;
      boldOccurrence += 1;
      return (
        <strong key={key} className="text-white font-bold">
          {boldText}
        </strong>
      );
    }
    return part;
  });
};

/**
 * Parser locale Storia/Patrono:
 * - `#` Markdown, `TITOLO:`, titoli impliciti uppercase
 * - paragrafi + `**bold**`
 * - `<br>` → newline, strip markup HTML sorgente
 */
const renderFormattedContent = (text: string): ReactNode => {
  if (!text) return null;

  const processedText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = processedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const occurrence = new Map<string, number>();

  return lines.map((line) => {
    const n = occurrence.get(line) ?? 0;
    occurrence.set(line, n + 1);
    const key = `${line}#${n}`;

    const isMarkdownHeader = line.startsWith('#');
    const isExplicitTitle = line.toUpperCase().startsWith('TITOLO:');
    const isImplicitTitle =
      line.length > 3 && line.length < 80 && line === line.toUpperCase() && !line.endsWith('.');

    if (isMarkdownHeader || isExplicitTitle || isImplicitTitle) {
      const titleContent = line
        .replace(/^#+\s*/, '')
        .replace(/^TITOLO:\s*/i, '')
        .replace(/\*\*/g, '')
        .trim();

      return (
        <h3 key={key} className={TITLE_CLASS}>
          {titleContent}
        </h3>
      );
    }

    return (
      <p key={key} className={PARAGRAPH_CLASS}>
        {renderInlineBold(line)}
      </p>
    );
  });
};

export const HistoryModal = ({ isOpen, onClose, city, openSuggestion, customText }: Props) => {
  useGlobalModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const rawText =
    customText || (city.details.historyFull || city.details.historySnippet || '').trim();

  return createPortal(
    <div
      className="td-modal-overlay bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in"
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        className="relative bg-[#020617] w-full max-w-4xl h-full md:max-h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto"
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 py-4 border-b border-slate-800 bg-[#0f172a] shrink-0 gap-4 md:gap-0">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-orange-500 shadow-lg">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="history-modal-title"
                  className="text-lg md:text-xl font-black text-white uppercase tracking-wider font-display leading-none"
                >
                  Storia e Origini
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  {city.name}
                </p>
              </div>
            </div>
            <div className="md:hidden">
              <CloseButton onClose={onClose} variant="primary" />
            </div>
          </div>

          <div className="hidden md:block">
            <CloseButton onClose={onClose} variant="primary" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#020617] relative">
          <div className="absolute top-20 right-10 opacity-[0.02] pointer-events-none select-none">
            <BookOpen className="w-96 h-96 text-orange-500" />
          </div>

          <div className="max-w-3xl mx-auto relative z-floating-panel animate-in fade-in slide-in-from-left-4">
            <div className="text-center mb-8 pt-4">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none">
                {city.name}
              </h1>
              <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            <div>{renderFormattedContent(rawText)}</div>

            {openSuggestion && (
              <div className="mt-16 pt-8 border-t border-slate-800/50 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openSuggestion();
                  }}
                  className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-orange-400 transition-colors uppercase font-black tracking-widest bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 hover:border-orange-500/50"
                >
                  <PenTool className="w-3.5 h-3.5" /> Suggerisci integrazione
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
