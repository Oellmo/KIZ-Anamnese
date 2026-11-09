import React from 'react';
import { ChevronLeft, ChevronRight, CheckCheck, Send } from 'lucide-react';
import { CHAPTERS } from '../data/kizFormStructure';

interface TabletBottomBarProps {
  currentChapterId: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToSummary: () => void;
  totalFlaggedCount: number;
}

export const TabletBottomBar: React.FC<TabletBottomBarProps> = ({
  currentChapterId,
  onPrev,
  onNext,
  onGoToSummary,
  totalFlaggedCount,
}) => {
  const isFirstChapter = currentChapterId === 0;
  const isLastQuestionChapter = currentChapterId === 8;
  const isSummaryChapter = currentChapterId === 9;

  const currentChapter = CHAPTERS.find((c) => c.id === currentChapterId) || CHAPTERS[0];

  return (
    <footer className="w-full shrink-0 z-40 bg-white border-t border-slate-300 py-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstChapter}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
            isFirstChapter
              ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Vorheriges Kapitel</span>
          <span className="sm:hidden">Zurück</span>
        </button>

        {/* Center Progress / Status */}
        <div className="flex flex-col items-center justify-center text-center px-2 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 truncate">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Kapitel {currentChapter.badge} von 8
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-600 font-medium truncate max-w-[200px]">
              {currentChapter.shortTitle}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
            <span>{totalFlaggedCount} Befunde protokolliert</span>
          </div>
        </div>

        {/* Forward / Finish Action */}
        {isSummaryChapter ? (
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-all min-h-[48px] active:scale-95"
          >
            <span>Zurück zum Protokoll</span>
          </button>
        ) : isLastQuestionChapter ? (
          <button
            type="button"
            onClick={onGoToSummary}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all min-h-[48px] active:scale-95"
          >
            <CheckCheck className="w-5 h-5 text-emerald-200" />
            <span>Zur Auswertung & Versand</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all min-h-[48px] active:scale-95"
          >
            <span className="hidden sm:inline">Nächstes Kapitel</span>
            <span className="sm:hidden">Weiter</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </footer>
  );
};
