import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  ExternalLink,
  Printer,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { KizFormData, StaffMember } from '../types/anamnese';
import { DEFAULT_STAFF_MEMBERS } from '../data/kizFormStructure';
import { buildMailtoUrl, generatePlainTextReport } from '../utils/exportHelpers';

interface StaffShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: KizFormData;
  onPrint: () => void;
}

const COVER_NOTE_TEMPLATES = [
  {
    id: 'standard',
    label: 'Standard: Fallkonferenz & Teambesprechung',
    text: (chiffre: string, datum: string) =>
      `Liebe Kolleginnen und Kollegen,\n\nanbei sende ich Ihnen die protokollierte Anamnese zu ${chiffre} (${datum}) zur Vorbereitung auf die anstehende Fallbesprechung.\n\nBitte prüfen Sie die Kriterien und die dokumentierte Zielvereinbarung für unser pädagogisches Angebot.`
  },
  {
    id: 'angebot',
    label: 'Passgenauigkeit KIZ-Angebot prüfen',
    text: (chiffre: string, datum: string) =>
      `Liebe Kolleginnen und Kollegen,\n\nanbei übermittle ich die Auswertung zur Chiffre ${chiffre} (${datum}) zur Prüfung der Passgenauigkeit unseres KIZ-Angebotes.\n\nBitte um kollegiale Rückmeldung bis zum nächsten Teamtermin.`
  },
  {
    id: 'hilfeplan',
    label: 'Vorbereitung Hilfeplangespräch',
    text: (chiffre: string, datum: string) =>
      `Liebe Kolleginnen und Kollegen,\n\nzur Vorbereitung des Hilfeplangesprächs mit dem zuständigen Kostenträger übersende ich das anonymisierte KIZ-Anamneseprotokoll zu Fall ${chiffre}.`
  }
];

export const StaffShareModal: React.FC<StaffShareModalProps> = ({
  isOpen,
  onClose,
  formData,
  onPrint,
}) => {
  if (!isOpen) return null;

  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF_MEMBERS);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(['1', '2']);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [coverNote, setCoverNote] = useState(() =>
    COVER_NOTE_TEMPLATES[0].text(formData.stammdaten.chiffre, formData.stammdaten.datum)
  );
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipients' | 'preview'>('recipients');

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

  const fullReportText = generatePlainTextReport(formData, true);

  const handleCopy = async () => {
    const combined = `${coverNote}\n\n===============================\n\n${fullReportText}`;
    await navigator.clipboard.writeText(combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoUrl = buildMailtoUrl(selectedEmails, formData, coverNote);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                An Mitarbeiter versenden
              </h3>
              <p className="text-xs text-slate-500">
                Fall: {formData.stammdaten.chiffre} ({formData.stammdaten.datum})
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

        {/* Modal Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('recipients')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'recipients'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Empfänger & Anschreiben ({selectedEmails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Protokoll-Vorschau</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'recipients' ? (
            <>
              {/* Recipient selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Mitarbeiter / Fachkräfte auswählen:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {staffList.map((staff) => {
                    const isSelected = selectedStaffIds.includes(staff.id);
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => toggleSelectStaff(staff.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {staff.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {staff.role}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-mono truncate">
                            {staff.email}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add custom email */}
              <form onSubmit={handleAddCustomStaff} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Weiteren Mitarbeiter hinzufügen:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Name / Funktion (optional)"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="mitarbeiter@einrichtung.de *"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 flex items-center justify-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hinzufügen</span>
                  </button>
                </div>
              </form>

              {/* Cover note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Standardisiertes Anschreiben (Vorlage auswählen):
                </label>
                <div className="space-y-1.5 mb-2.5">
                  {COVER_NOTE_TEMPLATES.map((tpl) => {
                    const isSelectedTpl = coverNote === tpl.text(formData.stammdaten.chiffre, formData.stammdaten.datum);
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setCoverNote(tpl.text(formData.stammdaten.chiffre, formData.stammdaten.datum))}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelectedTpl
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tpl.label}
                      </button>
                    );
                  })}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {coverNote}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  DSGVO-Schutz: Freitexteingaben sind deaktiviert, um eine versehentliche Namenseingabe zu verhindern.
                </span>
              </div>

              {/* Data protection note */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Datenschutz-Hinweis:</strong> Die Anamnese wird unter der Chiffre{' '}
                  <span className="font-mono font-bold">{formData.stammdaten.chiffre}</span> übermittelt.
                  Achten Sie auf verschlüsselte E-Mail-Kommunikation nach DSGVO.
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Vorschau des generierten Text-Protokolls:
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 leading-relaxed select-all">
                {coverNote}
                {'\n\n----------------------------------------------------------------\n\n'}
                {fullReportText}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Bericht kopiert' : 'Text kopieren'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onPrint();
              }}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Als PDF drucken</span>
            </button>
          </div>

          <a
            href={mailtoUrl}
            onClick={() => {
              setTimeout(onClose, 500);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-md transition-all active:scale-95 ${
              selectedEmails.length === 0
                ? 'bg-slate-400 pointer-events-none'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>In E-Mail-App öffnen ({selectedEmails.length})</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
