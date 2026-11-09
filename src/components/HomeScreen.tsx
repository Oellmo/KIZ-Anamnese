import React, { useState } from 'react';
import { 
  PlusCircle, 
  PlayCircle, 
  Shield, 
  ArrowRight, 
  AlertCircle,
  FolderOpen,
  ShieldAlert,
  Check,
  X,
  Loader2,
  Cloud
} from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import { getCaseByChiffreFromFirestore } from '../lib/firebase';
import { PWAInstallButton } from './PWAInstallButton';
import { LegalNoticeModal, LegalTab } from './LegalNoticeModal';

interface HomeScreenProps {
  onStartNewCase: () => void;
  onResumeCase: (caseId: string, targetChapterId: number, loadedCase?: KizFormData) => void;
  onOpenAdmin: () => void;
  cases: KizFormData[];
}

type PendingAction = 
  | { type: 'new' }
  | { type: 'resume'; caseId: string; targetChapterId: number; chiffre: string; loadedCase?: KizFormData }
  | null;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartNewCase,
  onResumeCase,
  onOpenAdmin,
  cases,
}) => {
  const [inputChiffre, setInputChiffre] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSearchingChiffre, setIsSearchingChiffre] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);

  const handleStartNewClick = () => {
    setPendingAction({ type: 'new' });
  };

  const handleResumeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = inputChiffre.trim().toUpperCase();
    if (!cleaned) {
      setErrorMessage('Bitte geben Sie eine 8-stellige Chiffre ein.');
      return;
    }

    // 1. Check in-memory cases first
    const matchedCase = cases.find(
      (c) => c.stammdaten.chiffre.trim().toUpperCase() === cleaned
    );

    if (matchedCase) {
      setErrorMessage('');
      const targetChapter = matchedCase.lastChapterId ?? 0;
      setPendingAction({
        type: 'resume',
        caseId: matchedCase.id,
        targetChapterId: targetChapter,
        chiffre: matchedCase.stammdaten.chiffre,
      });
      return;
    }

    // 2. Query Firestore directly for the case (no local storage needed)
    setIsSearchingChiffre(true);
    setErrorMessage('');
    try {
      const cloudCase = await getCaseByChiffreFromFirestore(cleaned);
      if (cloudCase) {
        const targetChapter = cloudCase.lastChapterId ?? 0;
        setPendingAction({
          type: 'resume',
          caseId: cloudCase.id,
          targetChapterId: targetChapter,
          chiffre: cloudCase.stammdaten.chiffre,
          loadedCase: cloudCase,
        });
      } else {
        setErrorMessage(`Keine Anamnese mit der Chiffre "${cleaned}" in Firebase gefunden.`);
      }
    } catch (err) {
      console.error('Error fetching case by chiffre:', err);
      setErrorMessage('Fehler bei der Cloud-Abfrage. Bitte Netzwerk prüfen.');
    } finally {
      setIsSearchingChiffre(false);
    }
  };

  const confirmAndProceed = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'new') {
      onStartNewCase();
    } else {
      onResumeCase(pendingAction.caseId, pendingAction.targetChapterId, pendingAction.loadedCase);
    }
    setPendingAction(null);
  };

  const handleInputChange = (val: string) => {
    // Only allow letters and numbers, max 8 characters, auto uppercase
    const filtered = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    setInputChiffre(filtered);
    if (errorMessage) setErrorMessage('');
  };

  return (
    <div className="min-h-full flex flex-col justify-between py-4 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Header / Intro */}
      <div className="text-center space-y-2 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Pädagogische Fallbeurteilung
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          KIZ Anamnese & Evaluation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Tablet-gestützte Dokumentation für strukturierte Entwicklungs- und Fallbeurteilungen im pädagogischen Setting.
        </p>
      </div>

      {/* PWA Install Banner (automatically hides if already installed in standalone mode) */}
      <PWAInstallButton variant="card" className="mb-6" />

      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Option 1: Neue Anamnese */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-600/30 shadow-md hover:border-emerald-600 hover:shadow-lg transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Neue Anamnese
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Startet eine neue Befragung mit einer zufälligen, eindeutigen 8-stelligen Patienten-Chiffre.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartNewClick}
            className="mt-6 w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Jetzt starten</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Option 2: Anamnese fortführen */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-blue-500/30 shadow-md hover:border-blue-600 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Anamnese fortführen
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Geben Sie die 8-stellige Chiffre ein, um direkt an der zuletzt bearbeiteten Stelle weiterzumachen.
              </p>
            </div>

            {/* Chiffre Input */}
            <form onSubmit={handleResumeSubmit} className="space-y-2 pt-1">
              <div className="relative">
                <input
                  type="text"
                  value={inputChiffre}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Chiffre"
                  maxLength={8}
                  className="w-full text-center tracking-widest font-mono font-bold text-lg px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 uppercase"
                />
              </div>

              {errorMessage && (
                <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearchingChiffre}
                className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSearchingChiffre ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>In Firebase suchen...</span>
                  </>
                ) : (
                  <>
                    <span>Fortsetzen</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Option 3: Admin-Bereich */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-300/80 shadow-md hover:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Admin-Bereich
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Geschütztes Dashboard für Fallakten-Verwaltung, Löschen von Einträgen & statistische Gesamtauswertung aller Items.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="mt-6 w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Verwaltung öffnen</span>
          </button>
        </div>
      </div>

      {/* Footer Info: Privacy, DSGVO, Impressum */}
      <footer className="pt-4 pb-2 border-t border-slate-200/60 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Anonyme Erfassung nach DSGVO
          </span>
          <span className="text-slate-300">•</span>
          <span>Keine Registrierung zum Ausfüllen nötig</span>
          <span className="text-slate-300">•</span>
          <span>Automatische Chiffrierung</span>
        </div>

        {/* Legal links row: Impressum & Datenschutz */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-medium pt-1">
          <button
            type="button"
            onClick={() => setLegalModalTab('datenschutz')}
            className="hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Datenschutzerklärung (DSGVO)
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setLegalModalTab('impressum')}
            className="hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Impressum (§ 5 DDG)
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setLegalModalTab('toms')}
            className="hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Sicherheitsmaßnahmen (TOM)
          </button>
        </div>
      </footer>

      {/* Datenschutz & Anonymisierungs Disclaimer Modal */}
      {pendingAction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-100 flex flex-col gap-5">
            {/* Header with warning icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
                  Wichtiger Datenschutzhinweis
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  Anonymisierung & Auswertung
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Disclaimer Warning Box */}
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 text-rose-950 space-y-2.5">
              <p className="font-extrabold text-sm sm:text-base text-rose-900 leading-snug">
                Auf keinen Fall personenbezogene Daten eingeben und auf keinen Fall Namen nennen!
              </p>
              <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                Da die erhobenen Daten <strong>zur Auswertung gespeichert werden</strong>, dürfen in keinen Freitextfeldern Klarnamen von Kindern, Eltern, Lehrkräften oder Einrichtungen hinterlegt werden.
              </p>
              <div className="pt-1 text-xs text-rose-900 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                <span>Verwenden Sie ausschließlich neutrale Bezeichnungen und die Chiffre.</span>
              </div>
            </div>

            {/* Target Case Context & Link to full Privacy Policy */}
            <div className="flex flex-col gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium text-slate-700">
                  {pendingAction.type === 'new' ? 'Vorgang:' : 'Fortzuführender Fall:'}
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                  {pendingAction.type === 'new' ? 'Neue Fall-Chiffre' : `Chiffre ${pendingAction.chiffre}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setLegalModalTab('datenschutz')}
                className="text-left text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-2 flex items-center gap-1 px-1 cursor-pointer"
              >
                <span>Vollständige DSGVO-Datenschutzerklärung öffnen</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer text-sm"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmAndProceed}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Verstanden & Weiter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Legal, Privacy & Impressum Modal */}
      <LegalNoticeModal
        isOpen={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'datenschutz'}
      />
    </div>
  );
};

