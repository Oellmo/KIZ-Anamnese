import React, { useState } from 'react';
import { 
  ChevronDown, 
  Home,
  ShieldCheck
} from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import { CHAPTERS } from '../data/kizFormStructure';
import { PWAInstallButton } from './PWAInstallButton';
import { LegalNoticeModal, LegalTab } from './LegalNoticeModal';

interface TabletHeaderProps {
  currentChapterId: number;
  onSelectChapter: (id: number) => void;
  formData: KizFormData;
  onOpenAdmin?: () => void;
  onGoHome: () => void;
  cloudSyncStatus?: 'synced' | 'saving' | 'offline' | 'error';
}

export const TabletHeader: React.FC<TabletHeaderProps> = ({
  currentChapterId,
  onSelectChapter,
  formData,
  onOpenAdmin,
  onGoHome,
  cloudSyncStatus,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  const currentChapter = CHAPTERS.find((c) => c.id === currentChapterId) || CHAPTERS[0];

  return (
    <header className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      {/* Top utility row: Homescreen, PWA Install & Cloud status */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer touch-pan-y"
            title="Zurück zum Homescreen"
          >
            <Home className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            <span>Homescreen</span>
          </button>
          <PWAInstallButton variant="header" />
          <button
            type="button"
            onClick={() => setLegalModalTab('datenschutz')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Datenschutz (DSGVO) & Impressum"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
            <span>DSGVO & Impressum</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {cloudSyncStatus && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : cloudSyncStatus === 'saving'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500'
                    : cloudSyncStatus === 'saving'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {cloudSyncStatus === 'synced'
                  ? 'In Firebase gespeichert'
                  : cloudSyncStatus === 'saving'
                  ? 'In Firebase speichern...'
                  : 'Lokal gespeichert'}
              </span>
              <span className="sm:hidden">
                {cloudSyncStatus === 'synced' ? 'Firebase' : 'Lokal'}
              </span>
            </span>
          )}

          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
            Chiffre: {formData.stammdaten.chiffre}
            {formData.stammdaten.alterInJahren ? ` • ${formData.stammdaten.alterInJahren} J.` : ''}
          </span>
        </div>
      </div>

      {/* Chapter navigation row */}
      <div className="px-4 py-2 flex items-center bg-slate-50/80">
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full sm:w-auto flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 shadow-xs hover:border-slate-400 text-left transition-all cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
              {currentChapter.badge}
            </span>
            <div className="truncate flex-1 min-w-0">
              <span className="block leading-tight">{currentChapter.title}</span>
              <span className="text-[11px] font-normal text-slate-500 hidden sm:block truncate">
                {currentChapter.subtitle}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu for chapters */}
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1.5 w-80 sm:w-96 max-h-[75vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-2 divide-y divide-slate-100">
                <div className="px-3 py-2 text-xs font-semibold text-slate-600 tracking-wider">
                  KAPITEL DIREKT ANSTEUERN
                </div>
                {CHAPTERS.map((ch) => {
                  const isActive = ch.id === currentChapterId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        onSelectChapter(ch.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                        isActive ? 'bg-emerald-50 text-emerald-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {ch.badge}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{ch.title}</div>
                        <div className="text-xs text-slate-500 truncate">{ch.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <LegalNoticeModal
        isOpen={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'datenschutz'}
      />
    </header>
  );
};
