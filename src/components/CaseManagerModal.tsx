import React, { useRef } from 'react';
import { 
  X, 
  FolderOpen, 
  PlusCircle, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  FileCheck,
  Calendar,
  Building2,
  Sparkles
} from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import { createEmptyFormData, createDemoFormData } from '../data/kizFormStructure';

interface CaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: KizFormData[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onSaveNewCase: (newCase: KizFormData) => void;
  onDeleteCase: (caseId: string) => void;
  onDuplicateCase: (caseToDup: KizFormData) => void;
}

export const CaseManagerModal: React.FC<CaseManagerModalProps> = ({
  isOpen,
  onClose,
  cases,
  activeCaseId,
  onSelectCase,
  onSaveNewCase,
  onDeleteCase,
  onDuplicateCase,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.stammdaten) {
          const importedCase: KizFormData = {
            ...parsed,
            id: 'imported_' + Date.now(),
            updatedAt: new Date().toISOString(),
          };
          onSaveNewCase(importedCase);
          onSelectCase(importedCase.id);
          onClose();
        } else {
          alert('Ungültiges KIZ-Dateiformat.');
        }
      } catch (err) {
        alert('Fehler beim Einlesen der JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateEmpty = () => {
    const newCase = createEmptyFormData(cases);
    onSaveNewCase(newCase);
    onSelectCase(newCase.id);
    onClose();
  };

  const handleLoadDemo = () => {
    const demo = createDemoFormData();
    onSaveNewCase(demo);
    onSelectCase(demo.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Fallakten & Anamnesen verwalten
              </h3>
              <p className="text-xs text-slate-500">
                Lokal auf diesem Tablet gespeicherte Protokolle ({cases.length})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action strip */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateEmpty}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Neues Protokoll anlegen</span>
            </button>

            <button
              onClick={handleLoadDemo}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Läd einen beispielhaft ausgefüllten Fall zum Ausprobieren"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Beispielfall laden</span>
            </button>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON Import</span>
            </button>
          </div>
        </div>

        {/* Case List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {cases.map((c) => {
            const isActive = c.id === activeCaseId;
            return (
              <div
                key={c.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div 
                  onClick={() => {
                    onSelectCase(c.id);
                    onClose();
                  }}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {c.stammdaten.chiffre || 'Keine Chiffre'}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white">
                        Aktiv
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {c.stammdaten.datum}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {c.stammdaten.kostentraeger || 'Kein Kostenträger'}
                    </span>
                    {c.stammdaten.fachkraft && (
                      <span className="truncate">Fachkraft: {c.stammdaten.fachkraft}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      onSelectCase(c.id);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isActive ? 'Geöffnet' : 'Öffnen'}
                  </button>

                  <button
                    onClick={() => onDuplicateCase(c)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Diesen Fall duplizieren"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {cases.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Fall "${c.stammdaten.chiffre}" wirklich löschen?`)) {
                          onDeleteCase(c.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Fall löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Automatisch im Browser-Speicher gesichert</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
