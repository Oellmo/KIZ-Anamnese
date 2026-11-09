import React, { useState } from 'react';
import { 
  Send,
  Printer, 
  Check, 
  Download, 
  Edit3, 
  FileText, 
  AlertTriangle, 
  ChevronRight, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Brain, 
  Activity, 
  HeartHandshake, 
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  Database
} from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import { computeFormStatistics, downloadJsonFile } from '../utils/exportHelpers';

interface SummaryEvaluationViewProps {
  formData: KizFormData;
  onEditChapter: (chapterId: number) => void;
  onSubmitCase?: () => Promise<void> | void;
  onGoHome?: () => void;
  onOpenAdmin?: () => void;
  onOpenShareModal?: () => void;
  onPrint: () => void;
}

export const SummaryEvaluationView: React.FC<SummaryEvaluationViewProps> = ({
  formData,
  onEditChapter,
  onSubmitCase,
  onGoHome,
  onOpenAdmin,
  onOpenShareModal,
  onPrint,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { totalMarkedCount, chapterStats } = computeFormStatistics(formData);

  const handleAbsenden = async () => {
    setIsSubmitting(true);
    try {
      if (onSubmitCase) {
        await onSubmitCase();
      } else if (onOpenShareModal) {
        onOpenShareModal();
      }
      setSubmitted(true);
      setShowSuccessModal(true);
    } catch (e) {
      console.error('Error on submit:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { stammdaten, ergaenzungen } = formData;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Top Banner / Call to Action */}
      <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Evaluation & Fallbeurteilung abgeschlossen
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              Anamneseprotokoll: {stammdaten.chiffre || 'Ohne Chiffre'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              Erfasst am {stammdaten.datum} • Kostenträger: {stammdaten.kostentraeger || 'Keine Angabe'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleAbsenden}
              disabled={isSubmitting}
              className={`px-4 py-2.5 font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                submitted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin" />
                  <span>Wird gespeichert...</span>
                </>
              ) : submitted ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Abgesendet</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Absenden</span>
                </>
              )}
            </button>

            <button
              onClick={onPrint}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF / Druck</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-emerald-800 text-center">
          <div className="bg-emerald-950/40 p-2.5 rounded-xl">
            <div className="text-2xl font-extrabold text-amber-300">{totalMarkedCount}</div>
            <div className="text-[11px] text-emerald-200">Kriterien / Befunde</div>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-xl">
            <div className="text-2xl font-extrabold text-emerald-300">{chapterStats.length} / 8</div>
            <div className="text-[11px] text-emerald-200">Relevante Kapitel</div>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-xl">
            <div className="text-base font-bold text-white truncate">
              {stammdaten.geschlecht}
              {stammdaten.alterInJahren ? ` • ${stammdaten.alterInJahren} J.` : ''}
            </div>
            <div className="text-[11px] text-emerald-200">Geschlecht & Alter</div>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-xl">
            <div className="text-base font-bold text-white truncate">
              {formData.iqSelectedCode ? formData.iqSelectedCode : 'k. A.'}
            </div>
            <div className="text-[11px] text-emerald-200">IQ-Kategorie</div>
          </div>
        </div>
      </div>

      {/* Case Details Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Rahmendaten des Protokolls
          </h3>
          <button
            onClick={() => onEditChapter(0)}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Stammdaten bearbeiten
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Chiffre:</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{stammdaten.chiffre || 'Keine'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Datum:</span>
            <span className="font-semibold text-slate-800 text-sm">{stammdaten.datum}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Geschlecht & Alter:</span>
            <span className="font-semibold text-slate-800 text-sm">
              {stammdaten.geschlecht || 'k. A.'}
              {stammdaten.alterInJahren ? ` (${stammdaten.alterInJahren} Jahre)` : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Kostenträger:</span>
            <span className="font-semibold text-slate-800 text-sm truncate block" title={stammdaten.kostentraeger || 'Keiner'}>
              {stammdaten.kostentraeger || 'Keiner'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Interviewer / Fachkraft:</span>
            <span className="font-semibold text-slate-800 text-sm truncate block" title={stammdaten.fachkraft || 'Nicht erfasst'}>
              {stammdaten.fachkraft || 'Nicht erfasst'}
            </span>
          </div>
        </div>
      </div>

      {/* Pedagogical Evaluation Card (Special Highlight) */}
      {(ergaenzungen.angebotsEvaluation || ergaenzungen.paedagogischeEinschaetzung || ergaenzungen.zielvereinbarung) && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              Pädagogische Evaluation & Passgenauigkeit unseres Angebots
            </h3>
            <button
              onClick={() => onEditChapter(8)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Ergänzungen bearbeiten
            </button>
          </div>

          {ergaenzungen.paedagogischeEinschaetzung && (
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Förderschwerpunkte:
              </span>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                {ergaenzungen.paedagogischeEinschaetzung}
              </p>
            </div>
          )}

          {ergaenzungen.angebotsEvaluation && (
            <div>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                Evaluation & Passgenauigkeit des Angebots:
              </span>
              <p className="text-sm text-emerald-950 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 leading-relaxed font-medium">
                {ergaenzungen.angebotsEvaluation}
              </p>
            </div>
          )}

          {ergaenzungen.zielvereinbarung && (
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Zielvereinbarung:
              </span>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                {ergaenzungen.zielvereinbarung}
              </p>
            </div>
          )}

          {ergaenzungen.naechsteSchritte && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Nächste Schritte:</span>
                <span className="text-slate-800">{ergaenzungen.naechsteSchritte}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Verantwortliche:</span>
                <span className="text-slate-800">{ergaenzungen.verantwortlich || 'Nicht zugewiesen'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Chapters Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Dokumentierte Befunde nach Kapiteln
          </h3>
          <span className="text-xs text-slate-500">
            Klicken Sie auf ein Kapitel, um direkt dorthin zu springen
          </span>
        </div>

        {chapterStats.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
            <p className="text-sm">Bisher wurden noch keine Auffälligkeiten oder Kriterien markiert.</p>
            <button
              onClick={() => onEditChapter(1)}
              className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              Mit Kapitel 1 beginnen
            </button>
          </div>
        ) : (
          chapterStats.map((stat) => (
            <div
              key={stat.chapterId}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
            >
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {stat.chapterId}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {stat.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 shrink-0">
                    {stat.count} {stat.count === 1 ? 'Eintrag' : 'Einträge'}
                  </span>
                </div>

                <button
                  onClick={() => onEditChapter(stat.chapterId)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bearbeiten</span>
                </button>
              </div>

              <div className="p-4 space-y-2.5 divide-y divide-slate-100">
                {stat.items.map((item, idx) => (
                  <div key={idx} className={`pt-2.5 first:pt-0 ${idx > 0 ? 'mt-2.5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {item.code}
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          {item.label}
                        </span>
                      </div>

                      {item.dauer && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded shrink-0">
                          {item.dauer}
                        </span>
                      )}
                    </div>

                    {item.beschreibung && (
                      <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                        <strong className="text-slate-700">Auswahl / Spezifikation:</strong> {item.beschreibung}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Export & Sharing Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Protokolldatei sichern oder archivieren:
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadJsonFile(formData)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>JSON herunterladen</span>
          </button>

          <button
            onClick={handleAbsenden}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              submitted
                ? 'bg-emerald-800 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Wird gespeichert...</span>
              </>
            ) : submitted ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Abgesendet</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Absenden</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Modal when submitted */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Fallakte erfolgreich abgesendet</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Die Anamnese zu Chiffre <strong className="text-slate-900">{stammdaten.chiffre || 'Ohne Chiffre'}</strong> wurde vollständig erfasst und sicher in der zentralen Firebase-Cloud-Datenbank gespeichert.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Chiffre:</span>
                <span className="font-bold text-slate-800">{stammdaten.chiffre || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Einrichtung / Gruppe:</span>
                <span className="font-medium text-slate-800">{stammdaten.einrichtung || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Datum:</span>
                <span className="text-slate-700">{stammdaten.datum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dokumentierte Kriterien:</span>
                <span className="font-bold text-emerald-700">{totalMarkedCount} Befunde</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {onGoHome && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onGoHome();
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Zur Startseite zurückkehren
                </button>
              )}

              {onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onOpenAdmin();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Zur Fallübersicht (Admin / Auswertung)
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
              >
                In der Auswertung bleiben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
