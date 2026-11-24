import React from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import { AggregatedAnalytics } from '../utils/analyticsHelpers';
import { AnalyticsReportContent } from './AnalyticsPrintReportView';

interface AnalyticsPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AggregatedAnalytics;
  analyticsCases: KizFormData[];
  facilityFilter: string;
}

export const AnalyticsPdfReportModal: React.FC<AnalyticsPdfReportModalProps> = ({
  isOpen,
  onClose,
  analytics,
  analyticsCases,
  facilityFilter,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:hidden">
      {/* Modal Container formatted for DIN A4 preview on screen */}
      <div className="bg-slate-100 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                DIN A4 Kohorten-, Radar- & Drill-Down-Bericht (PDF)
              </h2>
              <p className="text-xs text-slate-300">
                Mehrseitige DIN A4-Vorschau inkl. Haupt-Radar, aller 7 Drill-Down-Diagramme & Textbausteine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Als DIN A4 PDF drucken / speichern</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Vorschau schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable DIN A4 Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="bg-white max-w-[210mm] mx-auto p-6 sm:p-10 rounded-xl shadow-md border border-slate-200">
            <AnalyticsReportContent
              analytics={analytics}
              analyticsCases={analyticsCases}
              facilityFilter={facilityFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
