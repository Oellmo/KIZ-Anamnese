import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  User, 
  ShieldCheck, 
  School, 
  HeartHandshake, 
  Brain, 
  Activity, 
  Stethoscope, 
  CheckCircle2, 
  FileCheck,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Target,
  Check
} from 'lucide-react';
import { KizFormData, ItemEntry } from '../types/anamnese';
import { 
  CHAPTERS, 
  IQ_LEVELS, 
  SORGERECHT_OPTIONS, 
  GESUNDHEITSFUERSORGE_OPTIONS,
  IQ_TEST_VERFAHREN_OPTIONS,
  FOERDERSCHWERPUNKTE_OPTIONS,
  ANGEBOTS_PASSGENAUIGKEIT_OPTIONS,
  ZIELVEREINBARUNG_OPTIONS,
  NAECHSTE_SCHRITTE_OPTIONS,
  VERANTWORTLICH_OPTIONS,
  generateRandomChiffre
} from '../data/kizFormStructure';
import { ProtocolItemRow } from './ProtocolItemRow';

interface ChapterContainerProps {
  currentChapterId: number;
  formData: KizFormData;
  onChange: (updated: KizFormData) => void;
  onGoToSummary: () => void;
  existingCases?: KizFormData[];
  facilities?: string[];
}

export const ChapterContainer: React.FC<ChapterContainerProps> = ({
  currentChapterId,
  formData,
  onChange,
  onGoToSummary,
  existingCases,
  facilities,
}) => {
  const [filterOnlyMarked, setFilterOnlyMarked] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('all');

  const isDuplicateChiffre = useMemo(() => {
    const currentChiffre = formData.stammdaten?.chiffre?.trim().toUpperCase();
    if (!currentChiffre || !existingCases) return false;
    return existingCases.some(
      (c) => c.id !== formData.id && c.stammdaten?.chiffre?.trim().toUpperCase() === currentChiffre
    );
  }, [formData.stammdaten?.chiffre, formData.id, existingCases]);

  const currentChapter = CHAPTERS.find((c) => c.id === currentChapterId) || CHAPTERS[0];

  // Helper to update Stammdaten
  const updateStammdaten = (key: keyof typeof formData.stammdaten, val: string) => {
    onChange({
      ...formData,
      updatedAt: new Date().toISOString(),
      stammdaten: {
        ...formData.stammdaten,
        [key]: val,
      },
    });
  };

  // Helper to update Rechtlicher Status (Single-Choice)
  const selectSorgerecht = (id: string) => {
    const list = formData.rechtlicherStatus.sorgerecht || [];
    const next = list.includes(id) ? [] : [id];
    onChange({
      ...formData,
      updatedAt: new Date().toISOString(),
      rechtlicherStatus: {
        ...formData.rechtlicherStatus,
        sorgerecht: next,
      },
    });
  };

  const selectGesundheitsfuersorge = (id: string) => {
    const list = formData.rechtlicherStatus.gesundheitsfuersorge || [];
    const next = list.includes(id) ? [] : [id];
    onChange({
      ...formData,
      updatedAt: new Date().toISOString(),
      rechtlicherStatus: {
        ...formData.rechtlicherStatus,
        gesundheitsfuersorge: next,
      },
    });
  };

  // Helper for generic category item change
  const handleItemChange = (
    category: 'vorangegangeneHilfen' | 'schulsituation' | 'psychosozial' | 'entwicklungsstand' | 'symptomatik' | 'somatisch',
    code: string,
    entry: ItemEntry
  ) => {
    onChange({
      ...formData,
      updatedAt: new Date().toISOString(),
      [category]: {
        ...formData[category],
        [code]: entry,
      },
    });
  };

  // RENDER CHAPTER 0: STAMMDATEN
  if (currentChapterId === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              Falldaten & Rahmenbedingungen
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Erfassen Sie die Chiffre und Grunddaten des Falles zur datenschutzkonformen Dokumentation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chiffre / Fall-Kennung *
                </label>
                <button
                  type="button"
                  onClick={() => updateStammdaten('chiffre', generateRandomChiffre(existingCases))}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  title="Neue anonyme Zufalls-Chiffre generieren (kollisionssicher)"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Neu generieren</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.stammdaten.chiffre}
                onChange={(e) => {
                  const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
                  updateStammdaten('chiffre', sanitized);
                }}
                placeholder="z. B. K8M4X2A9"
                className={`w-full px-4 py-3 text-base rounded-xl font-mono font-bold tracking-wider transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                  isDuplicateChiffre
                    ? 'bg-rose-50 border-2 border-rose-500 text-rose-900 focus:ring-rose-500/40'
                    : 'bg-slate-50 border border-slate-200 text-emerald-900 focus:ring-emerald-600/40'
                }`}
              />
              {isDuplicateChiffre ? (
                <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>
                    Achtung: Diese Chiffre ist bereits an eine andere Fallakte vergeben! Bitte wählen Sie eine eindeutige Chiffre oder klicken Sie auf „Neu generieren“.
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Anonyme Fall-Kennung (keine Klarnamen).
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum des Gesprächs / der Anamnese *
              </label>
              <input
                type="date"
                value={formData.stammdaten.datum}
                onChange={(e) => updateStammdaten('datum', e.target.value)}
                className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kostenträger *
              </label>
              <select
                value={formData.stammdaten.kostentraeger || 'Jugendamt / SGB VIII'}
                onChange={(e) => updateStammdaten('kostentraeger', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-medium cursor-pointer"
              >
                <option value="Jugendamt / SGB VIII">Jugendamt (SGB VIII / §§ 27 ff., § 35a)</option>
                <option value="Eingliederungshilfe / SGB IX">Eingliederungshilfe (SGB IX / Teilhabe)</option>
                <option value="Sozialamt / SGB XII">Sozialamt (SGB XII)</option>
                <option value="Gesundheitsamt / KJP">Gesundheitsamt / KJP</option>
                <option value="Schulamt / SBBZ">Schulamt / SBBZ (Sonderpädagogischer Dienst)</option>
                <option value="Sonstiger öffentlicher Träger">Sonstiger öffentlicher Träger</option>
                <option value="Selbstzahler / Privat">Selbstzahler / Privat</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standardisierte Auswahl zur datenschutzkonformen Dokumentation.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Geschlecht des Kindes / Jugendlichen
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['männlich', 'weiblich', 'divers'].map((g) => {
                  const isSel = formData.stammdaten.geschlecht === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateStammdaten('geschlecht', g)}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center touch-pan-y cursor-pointer ${
                        isSel
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alter des Kindes (in Jahren) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="25"
                  step="1"
                  value={formData.stammdaten.alterInJahren !== undefined ? formData.stammdaten.alterInJahren : ''}
                  onChange={(e) => updateStammdaten('alterInJahren', e.target.value)}
                  placeholder="z. B. 10"
                  className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-semibold"
                />
                <span className="text-sm font-semibold text-slate-600 shrink-0 px-2">Jahre</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Lebensalter in vollendeten Jahren zur Kohorten- und Bedarfsanalyse.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pädagogische Fachkraft
              </label>
              <div className="w-full px-4 py-3 text-sm bg-slate-100/90 border border-slate-200 rounded-xl text-slate-800 font-medium flex items-center justify-between">
                <span>Pädagogischer Fachdienst</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                  DSGVO geschützt
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Zum Schutz persönlicher Daten wird kein Name im Protokoll hinterlegt.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Einrichtung / Gruppe der Einrichtung *</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                  Filterbar in Auswertung
                </span>
              </label>
              <select
                value={formData.stammdaten.einrichtung || (facilities && facilities[0]) || ''}
                onChange={(e) => updateStammdaten('einrichtung', e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-medium cursor-pointer"
              >
                {!formData.stammdaten.einrichtung && (
                  <option value="">
                    {facilities && facilities.length === 0
                      ? '— Noch keine Bereiche im Admin-Bereich angelegt —'
                      : '— Bitte Einrichtung / Gruppe wählen —'}
                  </option>
                )}
                {formData.stammdaten.einrichtung && 
                 facilities && 
                 !facilities.includes(formData.stammdaten.einrichtung) && (
                  <option value={formData.stammdaten.einrichtung}>
                    {formData.stammdaten.einrichtung} (Bestehende Zuordnung)
                  </option>
                )}
                {(facilities !== undefined ? facilities : [
                  'Haus im Feld',
                  'Haus im Feld – Gruppe Blau',
                  'Haus im Feld – Gruppe Gelb',
                  'Haus im Feld – Gruppe Grün',
                  'Haus im Feld – Kurzzeitbetreuung',
                  'Pilgerhaus Weinheim – KIZ Tagesgruppe',
                  'Pilgerhaus Weinheim – Wohngruppe Stammhaus',
                  'Pilgerhaus Weinheim – Wohngruppe Außenbereich',
                  'Peter-Koch-Schule (SBBZ)',
                  'Pilgerhaus Weinheim – Ambulante Hilfen',
                  'Kooperierende Einrichtung / Extern'
                ]).map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Zuordnung zu Wohngruppe oder Einrichtung des Pilgerhauses (z. B. Haus im Feld) für gezielte Kohorten-Auswertungen.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950">
            <span className="font-semibold block text-sm">Schrittweises Protokollieren für das Gespräch:</span>
            Tippen Sie unten auf <strong>"Weiter zu Kapitel 1"</strong>. Sie werden nun Kapitel für Kapitel durch den Fragebogen geführt, ohne von allen 8 Bereichen gleichzeitig überfordert zu werden. Alle Eingaben werden sekundengenau auf Ihrem Tablet zwischengespeichert.
          </div>
        </div>
      </div>
    );
  }

  // RENDER CHAPTER 1: RECHTLICHER STATUS
  if (currentChapterId === 1) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Sorgerecht Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Sorgerecht: Status / Inhaber:in der Vertretung
            </h3>
            <p className="text-xs text-slate-500">Wählen Sie die zutreffende Alternative aus (Einzelauswahl):</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SORGERECHT_OPTIONS.map((opt) => {
              const isChecked = formData.rechtlicherStatus.sorgerecht.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectSorgerecht(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectSorgerecht(opt.id);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all min-h-[52px] cursor-pointer touch-pan-y ${
                    isChecked
                      ? 'bg-amber-50/80 border-amber-400 text-slate-900 font-medium ring-1 ring-amber-400/40'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isChecked
                        ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gesundheitsfürsorge Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-700" />
              Gesundheitsfürsorge
            </h3>
            <p className="text-xs text-slate-500">Wer ist für medizinische Entscheidungen bevollmächtigt? (Einzelauswahl):</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GESUNDHEITSFUERSORGE_OPTIONS.map((opt) => {
              const isChecked = formData.rechtlicherStatus.gesundheitsfuersorge.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectGesundheitsfuersorge(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectGesundheitsfuersorge(opt.id);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all min-h-[52px] cursor-pointer touch-pan-y ${
                    isChecked
                      ? 'bg-amber-50/80 border-amber-400 text-slate-900 font-medium ring-1 ring-amber-400/40'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isChecked
                        ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // RENDER CHAPTER 5 SPECIAL: IQ SELECTOR
  const renderIqSelector = () => {
    return (
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-700" />
            5.2 Intelligenzniveau (IQ)
          </h3>
          <p className="text-xs text-slate-500">
            Wählen Sie die zutreffende diagnostische oder geschätzte IQ-Kategorie:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {IQ_LEVELS.map((iq) => {
            const isSelected = formData.iqSelectedCode === iq.code;
            return (
              <div
                key={iq.code}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onChange({
                    ...formData,
                    updatedAt: new Date().toISOString(),
                    iqSelectedCode: isSelected ? '' : iq.code,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange({
                      ...formData,
                      updatedAt: new Date().toISOString(),
                      iqSelectedCode: isSelected ? '' : iq.code,
                    });
                  }
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[56px] cursor-pointer touch-pan-y ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-500 text-slate-900 font-semibold ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${
                    isSelected
                      ? 'bg-indigo-700 border-indigo-700 text-white'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div>
                  <span className="font-mono text-xs text-indigo-700 block font-medium">
                    {iq.code}
                  </span>
                  <span className="text-sm leading-tight block">{iq.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Diagnostisches Testverfahren (standardisierte Auswahl):
          </label>
          <select
            value={formData.iqNotiz || 'Kein Testverfahren dokumentiert'}
            onChange={(e) =>
              onChange({
                ...formData,
                updatedAt: new Date().toISOString(),
                iqNotiz: e.target.value,
              })
            }
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium cursor-pointer"
          >
            {IQ_TEST_VERFAHREN_OPTIONS.map((verf) => (
              <option key={verf} value={verf}>
                {verf}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Standardisierte Dokumentation nach Vorgabe ohne Freitextfelder.
          </span>
        </div>
      </div>
    );
  };

  // RENDER CHAPTER 8: ERGÄNZUNGEN & EVALUATION (REIN STRUKTURIERT, KEINE FREITEXTE)
  if (currentChapterId === 8) {
    const erg = formData.ergaenzungen;
    const updateErg = (key: keyof typeof erg, value: string) => {
      onChange({
        ...formData,
        updatedAt: new Date().toISOString(),
        ergaenzungen: {
          ...formData.ergaenzungen,
          [key]: value,
        },
      });
    };

    const selectedFoerderschwerpunkte = erg.paedagogischeEinschaetzung
      ? erg.paedagogischeEinschaetzung.split('; ').map((s) => s.trim()).filter(Boolean)
      : [];

    const toggleFoerderschwerpunkt = (opt: string) => {
      const next = selectedFoerderschwerpunkte.includes(opt)
        ? selectedFoerderschwerpunkte.filter((x) => x !== opt)
        : [...selectedFoerderschwerpunkte, opt];
      updateErg('paedagogischeEinschaetzung', next.join('; '));
    };

    const selectedZiele = erg.zielvereinbarung
      ? erg.zielvereinbarung.split('; ').map((s) => s.trim()).filter(Boolean)
      : [];

    const toggleZiel = (opt: string) => {
      const next = selectedZiele.includes(opt)
        ? selectedZiele.filter((x) => x !== opt)
        : [...selectedZiele, opt];
      updateErg('zielvereinbarung', next.join('; '));
    };

    const selectedSchritte = erg.naechsteSchritte
      ? erg.naechsteSchritte.split('; ').map((s) => s.trim()).filter(Boolean)
      : [];

    const toggleSchritt = (opt: string) => {
      const next = selectedSchritte.includes(opt)
        ? selectedSchritte.filter((x) => x !== opt)
        : [...selectedSchritte, opt];
      updateErg('naechsteSchritte', next.join('; '));
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-700" />
                8. Ergänzungen & Evaluation unseres pädagogischen Angebotes
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standardisierte Evaluation, Passgenauigkeit des KIZ-Angebots und Zielvereinbarungen.
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
              DSGVO-konform (ohne Freitext)
            </span>
          </div>

          {/* 8.1 Pädagogische Förderschwerpunkte (Mehrfachauswahl) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                8.1 Pädagogische Förderschwerpunkte (Mehrfachauswahl):
              </label>
              {selectedFoerderschwerpunkte.length > 0 && (
                <span className="text-xs font-semibold text-emerald-700">
                  {selectedFoerderschwerpunkte.length} gewählt
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FOERDERSCHWERPUNKTE_OPTIONS.map((opt) => {
                const isChecked = selectedFoerderschwerpunkte.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleFoerderschwerpunkt(opt)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer touch-pan-y ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8.2 Passgenauigkeit des KIZ-Angebotes (Einzelauswahl) */}
          <div className="space-y-2.5 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
              8.2 Passgenauigkeit unseres pädagogischen Angebots (Einzelauswahl):
            </label>
            <div className="space-y-2">
              {ANGEBOTS_PASSGENAUIGKEIT_OPTIONS.map((opt) => {
                const isSelected = erg.angebotsEvaluation === opt;
                return (
                  <div
                    key={opt}
                    role="button"
                    tabIndex={0}
                    onClick={() => updateErg('angebotsEvaluation', opt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateErg('angebotsEvaluation', opt);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer touch-pan-y ${
                      isSelected
                        ? 'bg-white border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-600/30 shadow-xs'
                        : 'bg-white/70 border-emerald-200/80 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 transition-all ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs sm:text-sm leading-snug">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8.3 Zielvereinbarungen (Mehrfachauswahl) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                8.3 Zielvereinbarungen für den Hilfeplan (Mehrfachauswahl):
              </label>
              {selectedZiele.length > 0 && (
                <span className="text-xs font-semibold text-emerald-700">
                  {selectedZiele.length} gewählt
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ZIELVEREINBARUNG_OPTIONS.map((opt) => {
                const isChecked = selectedZiele.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleZiel(opt)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer touch-pan-y ${
                      isChecked
                        ? 'bg-amber-50/80 border-amber-500 text-slate-900 font-semibold ring-1 ring-amber-500/30'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                        isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8.4 Nächste Schritte & Verantwortliche */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                8.4 Nächste Schritte (Mehrfachauswahl):
              </label>
              <div className="space-y-1.5">
                {NAECHSTE_SCHRITTE_OPTIONS.map((opt) => {
                  const isChecked = selectedSchritte.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleSchritt(opt)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer touch-pan-y ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-semibold ring-1 ring-blue-400/30'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                8.5 Federführende Fallverantwortung:
              </label>
              <div className="space-y-1.5">
                {VERANTWORTLICH_OPTIONS.map((opt) => {
                  const isSelected = erg.verantwortlich === opt;
                  return (
                    <div
                      key={opt}
                      role="button"
                      tabIndex={0}
                      onClick={() => updateErg('verantwortlich', opt)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          updateErg('verantwortlich', opt);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer touch-pan-y ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 transition-all ${
                          isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs leading-snug">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD CHAPTERS WITH SECTIONS: 2, 3, 4, 5, 6, 7
  const categoryMap: Record<number, 'vorangegangeneHilfen' | 'schulsituation' | 'psychosozial' | 'entwicklungsstand' | 'symptomatik' | 'somatisch'> = {
    2: 'vorangegangeneHilfen',
    3: 'schulsituation',
    4: 'psychosozial',
    5: 'entwicklungsstand',
    6: 'symptomatik',
    7: 'somatisch',
  };

  const currentCategory = categoryMap[currentChapterId];
  const categoryData = currentCategory ? formData[currentCategory] || {} : {};

  // For long chapters like Chapter 4 (Psychosozial) or Chapter 6 (Symptomatik),
  // provide sub-section filter buttons so the tablet screen is not overwhelmingly tall
  const sections = currentChapter.sections || [];
  const hasMultipleSections = sections.length > 1;

  // Filter sections if activeSectionId is set
  const visibleSections = activeSectionId === 'all'
    ? sections
    : sections.filter((s) => s.id === activeSectionId);

  // Count marked items in this chapter
  const markedInChapter = sections.reduce((acc, sec) => {
    return (
      acc +
      sec.items.filter((item) => {
        const e = categoryData[item.code];
        return e && e.selected;
      }).length
    );
  }, 0) + (currentChapterId === 5 && formData.iqSelectedCode ? 1 : 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* Chapter Sub-Navigation & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {markedInChapter} {markedInChapter === 1 ? 'Auffälligkeit erfasst' : 'Auffälligkeiten erfasst'}
          </span>
          {markedInChapter > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              aktiv
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Filter to show only marked items */}
          <button
            type="button"
            onClick={() => setFilterOnlyMarked(!filterOnlyMarked)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              filterOnlyMarked
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Nur markierte ({markedInChapter})</span>
          </button>
        </div>
      </div>

      {/* Sub-section tab chips for extensive chapters (like 4.1 to 4.9 or 2.1 to 2.3) */}
      {hasMultipleSections && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => setActiveSectionId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSectionId === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Alle Unterabschnitte ({sections.length})
          </button>
          {sections.map((sec) => {
            const isSecActive = activeSectionId === sec.id;
            const secMarkedCount = sec.items.filter((item) => categoryData[item.code]?.selected).length;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSecActive
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{sec.id}</span>
                {secMarkedCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                    {secMarkedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Render Sections */}
      <div className="space-y-5">
        {visibleSections.map((sec) => {
          const displayedItems = filterOnlyMarked
            ? sec.items.filter((item) => categoryData[item.code]?.selected)
            : sec.items;

          if (filterOnlyMarked && displayedItems.length === 0) {
            return null;
          }

          return (
            <div key={sec.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {sec.title}
                </h3>
                <span className="text-xs text-slate-600 font-mono">
                  {displayedItems.length} {displayedItems.length === 1 ? 'Frage' : 'Fragen'}
                </span>
              </div>

              <div className="space-y-2.5">
                {displayedItems.map((item) => {
                  const entry = categoryData[item.code];
                  return (
                    <ProtocolItemRow
                      key={item.code}
                      code={item.code}
                      label={item.label}
                      hasDauer={item.hasDauer}
                      hasBeschreibung={item.hasBeschreibung}
                      placeholder={item.placeholder}
                      sublabel={item.sublabel}
                      dropdownOptions={item.dropdownOptions}
                      dropdownSelectionMode={item.dropdownSelectionMode}
                      entry={entry}
                      onChange={(newEntry) => handleItemChange(currentCategory, item.code, newEntry)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Special IQ section in Chapter 5 */}
      {currentChapterId === 5 && (!filterOnlyMarked || !!formData.iqSelectedCode) && (
        renderIqSelector()
      )}
    </div>
  );
};
