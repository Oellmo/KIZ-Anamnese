import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  Shield, 
  FolderOpen, 
  Share2, 
  Printer, 
  PlusCircle, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Mail, 
  Users, 
  FileText, 
  ExternalLink,
  Sparkles,
  Calendar,
  Building2,
  Clock,
  Save,
  Cloud,
  Database,
  UploadCloud,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { KizFormData, StaffMember } from '../types/anamnese';
import { DEFAULT_STAFF_MEMBERS, createEmptyFormData, createDemoFormData } from '../data/kizFormStructure';
import { buildMailtoUrl, generatePlainTextReport, downloadJsonFile } from '../utils/exportHelpers';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: KizFormData[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onSaveNewCase: (newCase: KizFormData) => void;
  onDeleteCase: (caseId: string) => void;
  onDuplicateCase: (caseToDup: KizFormData) => void;
  onPrint: () => void;
  lastSavedText: string;
  currentUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onSyncAllToFirebase?: () => Promise<void>;
  cloudSyncStatus?: 'synced' | 'saving' | 'offline' | 'error';
  isAdmin?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  cases,
  activeCaseId,
  onSelectCase,
  onSaveNewCase,
  onDeleteCase,
  onDuplicateCase,
  onPrint,
  lastSavedText,
  currentUser,
  onLogin,
  onLogout,
  onSyncAllToFirebase,
  cloudSyncStatus = 'offline',
  isAdmin = false,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'cases' | 'share' | 'export'>('cases');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    if (!onSyncAllToFirebase) return;
    try {
      setIsSyncing(true);
      await onSyncAllToFirebase();
      setSyncFeedback('Alle Fälle erfolgreich in Firebase gespeichert!');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (e) {
      setSyncFeedback('Fehler beim Synchronisieren.');
      setTimeout(() => setSyncFeedback(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Staff share state
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF_MEMBERS);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(['1', '2']);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [coverNote, setCoverNote] = useState(
    `Liebe Kolleginnen und Kollegen,\n\nanbei die Anamnese und strukturierte Fallbeurteilung zu ${activeCase?.stammdaten?.chiffre || 'Fall'} (${activeCase?.stammdaten?.datum || ''}) zur Auswertung für unser neues pädagogisches Angebot.`
  );
  const [copied, setCopied] = useState(false);

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
  };

  const handleLoadDemo = () => {
    const demo = createDemoFormData();
    onSaveNewCase(demo);
    onSelectCase(demo.id);
  };

  const toggleSelectStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail.trim()) return;
    const newMember: StaffMember = {
      id: 'custom_' + Date.now(),
      name: newStaffName.trim() || 'Mitarbeiter:in',
      role: 'Team / Extern',
      email: newStaffEmail.trim(),
    };
    setStaffList((prev) => [...prev, newMember]);
    setSelectedStaffIds((prev) => [...prev, newMember.id]);
    setNewStaffName('');
    setNewStaffEmail('');
  };

  const selectedEmails = staffList
    .filter((s) => selectedStaffIds.includes(s.id))
    .map((s) => s.email);

  const fullReportText = generatePlainTextReport(activeCase, true);

  const handleCopyReport = async () => {
    const combined = `${coverNote}\n\n===============================\n\n${fullReportText}`;
    await navigator.clipboard.writeText(combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoUrl = buildMailtoUrl(selectedEmails, activeCase, coverNote);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Admin-Bereich
              </h3>
              <p className="text-xs text-slate-500">
                Verwaltung, Fallakten & Mitarbeiter-Versand • Aktiver Fall: <span className="font-semibold text-slate-800">{activeCase.stammdaten.chiffre}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Firebase Cloud Admin Authentication Box */}
        <div className="px-5 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 border-b border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Cloud className={`w-4 h-4 shrink-0 ${currentUser ? (isAdmin ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-400'}`} />
              <span className="font-bold text-slate-100">Firebase Cloud-Verwaltung (Admin):</span>
              {currentUser ? (
                isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Admin verifiziert
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                    Eingeloggt (Kein Admin)
                  </span>
                )
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Nicht angemeldet
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {currentUser
                ? `Angemeldet: ${currentUser.email || currentUser.displayName} ${isAdmin ? '• Vollzugriff auf Cloud-Sicherung' : '• Keine Administrator-Rechte'}`
                : 'Login nur für Praxisleitung / Administrator (stefanbareis@gmail.com). Der Bogen ist für alle ohne Anmeldung nutzbar.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {currentUser ? (
              <>
                {isAdmin && onSyncAllToFirebase && (
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Synchronisiere...' : 'In Firebase sichern'}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-700"
                  >
                    <LogOut className="w-3.5 h-3.5 inline mr-1" />
                    <span>Abmelden</span>
                  </button>
                )}
              </>
            ) : (
              onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Als Admin anmelden</span>
                </button>
              )
            )}
          </div>
        </div>

        {syncFeedback && (
          <div className="px-5 py-2 bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-semibold flex items-center gap-2 shrink-0 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="px-5 pt-2.5 border-b border-slate-100 flex gap-4 text-xs font-semibold shrink-0 bg-slate-50/40">
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cases'
                ? 'border-emerald-600 text-emerald-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Fallakten ({cases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'share'
                ? 'border-emerald-600 text-emerald-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>An Mitarbeiter versenden</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Druck & Datensicherung</span>
          </button>
        </div>

        {/* Tab 1: Fallakten verwalten */}
        {activeTab === 'cases' && (
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateEmpty}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Neuen Fall anlegen</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>JSON Import</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {cases.map((c) => {
                const isActive = c.id === activeCaseId;
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                            Aktiv in Bearbeitung
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
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCase(c.id);
                          onClose();
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isActive ? 'Ausgewählt' : 'Bearbeiten'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateCase(c)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Duplizieren"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {cases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Fall "${c.stammdaten.chiffre}" wirklich löschen?`)) {
                              onDeleteCase(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: An Mitarbeiter versenden */}
        {activeTab === 'share' && (
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Empfänger auswählen:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {staffList.map((staff) => {
                  const isSelected = selectedStaffIds.includes(staff.id);
                  return (
                    <div
                      key={staff.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSelectStaff(staff.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {staff.name}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-mono truncate">
                          {staff.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anschreiben */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Standardisiertes Anschreiben:
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  {
                    id: 'std',
                    lbl: 'Fallbesprechung',
                    txt: `Liebe Kolleginnen und Kollegen,\n\nanbei die Anamnese und strukturierte Fallbeurteilung zu ${activeCase?.stammdaten?.chiffre || 'Fall'} (${activeCase?.stammdaten?.datum || ''}) zur Auswertung für unser pädagogisches Angebot.`
                  },
                  {
                    id: 'eval',
                    lbl: 'KIZ-Passgenauigkeit',
                    txt: `Liebe Kolleginnen und Kollegen,\n\nanbei die anonymisierte Dokumentation zu Fall ${activeCase?.stammdaten?.chiffre || 'Fall'} zur Prüfung der Passgenauigkeit unseres KIZ-Angebotes.`
                  },
                  {
                    id: 'hp',
                    lbl: 'Hilfeplan',
                    txt: `Liebe Kolleginnen und Kollegen,\n\nzur Vorbereitung des anstehenden Hilfeplangesprächs sende ich den KIZ-Anamnesebogen zu Fall ${activeCase?.stammdaten?.chiffre || 'Fall'}.`
                  }
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setCoverNote(tpl.txt)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                      coverNote === tpl.txt
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {tpl.lbl}
                  </button>
                ))}
              </div>
              <div className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap leading-relaxed">
                {coverNote}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Bericht kopiert!' : 'Bericht kopieren'}</span>
              </button>

              <a
                href={mailtoUrl}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-xs transition-all ${
                  selectedEmails.length === 0
                    ? 'bg-slate-400 pointer-events-none'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>In E-Mail öffnen ({selectedEmails.length})</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: Druck & Export */}
        {activeTab === 'export' && (
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-600" />
                Drucken / Als PDF exportieren
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Erzeugt das druckfertige, tabellarische A4-Protokoll im Original-Layout des KIZ-Bogens für die Akte.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrint();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Druckdialog / PDF öffnen</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-4 h-4 text-slate-600" />
                JSON-Datensicherung
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Exportiert alle erfassten Falldaten und Notizen als JSON-Sicherungsdatei zum Archivieren oder Weitertransferieren.
              </p>
              <button
                type="button"
                onClick={() => downloadJsonFile(activeCase)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>JSON herunterladen</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1">
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lastSavedText}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold cursor-pointer"
          >
            Zurück zur Bearbeitung
          </button>
        </div>
      </div>
    </div>
  );
};
