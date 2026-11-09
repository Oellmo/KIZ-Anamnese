import React from 'react';
import { KizFormData } from '../types/anamnese';
import { CHAPTERS, IQ_LEVELS, SORGERECHT_OPTIONS, GESUNDHEITSFUERSORGE_OPTIONS } from '../data/kizFormStructure';

interface PrintReportViewProps {
  formData: KizFormData;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ formData }) => {
  const { stammdaten, ergaenzungen } = formData;

  const categoryMap: Record<number, any> = {
    2: formData.vorangegangeneHilfen,
    3: formData.schulsituation,
    4: formData.psychosozial,
    5: formData.entwicklungsstand,
    6: formData.symptomatik,
    7: formData.somatisch,
  };

  return (
    <div className="hidden print:block font-sans text-slate-900 p-4 max-w-5xl mx-auto bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11px;
          }
          .page-break {
            page-break-before: always;
          }
          .no-break {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Official Header bar matching PDF */}
      <div className="border border-slate-700 bg-slate-100 p-3 mb-3">
        <h1 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
          ANAMNESE ZUR STRUKTURIERTEN FALLBEURTEILUNG (KIZ)
        </h1>
      </div>

      {/* Meta Grid matching PDF Page 1 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-slate-400 p-3 mb-4 text-xs">
        <div className="flex gap-2">
          <strong className="w-24">Chiffre:</strong>
          <span className="font-mono font-bold">{stammdaten.chiffre || '—'}</span>
        </div>
        <div className="flex gap-2">
          <strong className="w-24">Datum:</strong>
          <span>{stammdaten.datum || '—'}</span>
        </div>
        <div className="flex gap-2">
          <strong className="w-24">Kostenträger:</strong>
          <span>{stammdaten.kostentraeger || '—'}</span>
        </div>
        <div className="flex gap-2">
          <strong className="w-24">Geschlecht:</strong>
          <span>{stammdaten.geschlecht || '—'}{stammdaten.alterInJahren ? ` (${stammdaten.alterInJahren} Jahre)` : ''}</span>
        </div>
        {stammdaten.fachkraft && (
          <div className="flex gap-2 col-span-2">
            <strong className="w-24">Fachkraft:</strong>
            <span>{stammdaten.fachkraft}</span>
          </div>
        )}
      </div>

      {/* 1. RECHTLICHER STATUS */}
      <div className="mb-4 no-break">
        <div className="bg-slate-200 border border-slate-400 px-2 py-1 font-bold text-xs uppercase mb-1">
          1. RECHTLICHER STATUS
        </div>
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <tbody>
            <tr className="border-b border-slate-400">
              <td className="w-1/4 p-2 font-bold bg-slate-50 border-r border-slate-400 align-top">
                Sorgerecht:
              </td>
              <td className="p-2 align-top">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {SORGERECHT_OPTIONS.map((opt) => {
                    const isChecked = formData.rechtlicherStatus.sorgerecht.includes(opt.id);
                    return (
                      <span key={opt.id} className="inline-flex items-center gap-1">
                        <span className="font-mono">{isChecked ? '[X]' : '[  ]'}</span>
                        <span className={isChecked ? 'font-bold' : ''}>{opt.label}</span>
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
            <tr>
              <td className="w-1/4 p-2 font-bold bg-slate-50 border-r border-slate-400 align-top">
                Gesundheitsfürsorge:
              </td>
              <td className="p-2 align-top">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {GESUNDHEITSFUERSORGE_OPTIONS.map((opt) => {
                    const isChecked = formData.rechtlicherStatus.gesundheitsfuersorge.includes(opt.id);
                    return (
                      <span key={opt.id} className="inline-flex items-center gap-1">
                        <span className="font-mono">{isChecked ? '[X]' : '[  ]'}</span>
                        <span className={isChecked ? 'font-bold' : ''}>{opt.label}</span>
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Chapters 2 to 7 */}
      {[2, 3, 4, 5, 6, 7].map((chId) => {
        const chapter = CHAPTERS.find((c) => c.id === chId);
        if (!chapter || !chapter.sections) return null;
        const dataObj = categoryMap[chId] || {};

        return (
          <div key={chId} className="mb-4 no-break">
            <div className="bg-slate-200 border border-slate-400 px-2 py-1 font-bold text-xs uppercase mb-1">
              {chapter.title}
            </div>

            {chapter.sections.map((sec) => (
              <div key={sec.id} className="mb-2">
                <div className="font-bold text-slate-800 text-xs mb-1 px-1">{sec.title}</div>
                <table className="w-full border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 text-[10px]">
                      <th className="p-1 w-12 border-r border-slate-400 text-center">Auswahl</th>
                      <th className="p-1 w-16 border-r border-slate-400 text-center">Code</th>
                      <th className="p-1 text-left border-r border-slate-400">Kriterium / Maßnahme / Verlauf</th>
                      {chId === 2 && <th className="p-1 w-32 text-left">Dauer (Monate)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((item) => {
                      const entry = dataObj[item.code];
                      const isSel = !!entry?.selected;
                      return (
                        <tr key={item.code} className={`border-b border-slate-300 ${isSel ? 'bg-amber-50/50 font-medium' : ''}`}>
                          <td className="p-1 text-center font-mono border-r border-slate-400">
                            {isSel ? '[X]' : '[  ]'}
                          </td>
                          <td className="p-1 font-mono text-center border-r border-slate-400">
                            {item.code}
                          </td>
                          <td className="p-1 border-r border-slate-400">
                            <div>{item.label}</div>
                            {entry?.beschreibung && (
                              <div className="text-[11px] text-slate-700 italic mt-0.5 font-normal">
                                Details: {entry.beschreibung}
                              </div>
                            )}
                          </td>
                          {chId === 2 && (
                            <td className="p-1 font-medium">
                              {entry?.dauer || '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Special IQ Section in chapter 5 */}
            {chId === 5 && (
              <div className="mt-2 border border-slate-400 p-2 text-xs">
                <div className="font-bold mb-1">5.2 Intelligenzniveau (IQ):</div>
                <div className="flex flex-wrap gap-3">
                  {IQ_LEVELS.map((iq) => {
                    const isSel = formData.iqSelectedCode === iq.code;
                    return (
                      <span key={iq.code} className="inline-flex items-center gap-1">
                        <span className="font-mono">{isSel ? '[X]' : '[  ]'}</span>
                        <span className={isSel ? 'font-bold' : ''}>{iq.label}</span>
                      </span>
                    );
                  })}
                </div>
                {formData.iqNotiz && (
                  <div className="mt-1 text-slate-700 italic">Testverfahren: {formData.iqNotiz}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 8. ERGÄNZUNGEN & EVALUATION */}
      <div className="mb-4 no-break">
        <div className="bg-slate-200 border border-slate-400 px-2 py-1 font-bold text-xs uppercase mb-1">
          8. ERGÄNZUNGEN & EVALUATION DES PÄDAGOGISCHEN ANGEBOTES
        </div>
        <div className="border border-slate-400 p-3 text-xs space-y-2">
          {ergaenzungen.paedagogischeEinschaetzung && (
            <div>
              <strong className="block">8.1 Förderschwerpunkte:</strong>
              <p className="whitespace-pre-wrap">{ergaenzungen.paedagogischeEinschaetzung}</p>
            </div>
          )}
          {ergaenzungen.angebotsEvaluation && (
            <div className="bg-slate-100 p-2 rounded">
              <strong className="block">8.2 Evaluation & Passgenauigkeit des KIZ-Angebotes:</strong>
              <p className="whitespace-pre-wrap font-medium">{ergaenzungen.angebotsEvaluation}</p>
            </div>
          )}
          {ergaenzungen.zielvereinbarung && (
            <div>
              <strong className="block">8.3 Zielvereinbarungen für den Hilfeplan:</strong>
              <p className="whitespace-pre-wrap">{ergaenzungen.zielvereinbarung}</p>
            </div>
          )}
          {ergaenzungen.naechsteSchritte && (
            <div>
              <strong className="block">8.4 Nächste Schritte & Verantwortliche:</strong>
              <p className="whitespace-pre-wrap">
                {ergaenzungen.naechsteSchritte} {ergaenzungen.verantwortlich ? `(Verantwortlich: ${ergaenzungen.verantwortlich})` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-400 flex justify-between text-[10px] text-slate-600">
        <span>KIZ-Anamneseprotokoll • Fall {stammdaten.chiffre}</span>
        <span>Dokumentiert am: {new Date(formData.updatedAt).toLocaleDateString('de-DE')}</span>
      </div>
    </div>
  );
};
