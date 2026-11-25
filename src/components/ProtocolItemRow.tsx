import React, { useState, useRef, useEffect } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { ItemEntry } from '../types/anamnese';

interface ProtocolItemRowProps {
  code: string;
  label: string;
  description?: string;
  selectionType?: 'single' | 'multiple';
  entry?: ItemEntry;
  onChange: (newEntry: ItemEntry) => void;
  hasDauer?: boolean;
  hasBeschreibung?: boolean;
  placeholder?: string;
  sublabel?: string;
  dropdownOptions?: string[];
  dropdownSelectionMode?: 'single' | 'multiple';
}

export const ProtocolItemRow: React.FC<ProtocolItemRowProps> = ({
  code,
  label,
  description,
  selectionType = 'multiple',
  entry,
  onChange,
  hasDauer,
  hasBeschreibung,
  placeholder,
  sublabel,
  dropdownOptions,
  dropdownSelectionMode = 'multiple',
}) => {
  const isSelected = !!entry?.selected;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Derive selected options from array or comma-separated string
  const selectedOptions: string[] = entry?.selectedOptions || (
    entry?.beschreibung ? entry.beschreibung.split(', ').map((s) => s.trim()).filter(Boolean) : []
  );

  const toggleSelect = () => {
    const nextSelected = selectionType === 'single' ? true : !isSelected;
    onChange({
      selected: nextSelected,
      dauer: entry?.dauer || '',
      beschreibung: nextSelected && selectedOptions.length > 0 ? selectedOptions.join(', ') : '',
      selectedOptions: nextSelected ? selectedOptions : [],
      tags: [],
    });
    if (nextSelected && dropdownOptions && dropdownOptions.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const toggleOption = (option: string) => {
    if (dropdownSelectionMode === 'single') {
      const nextOptions = selectedOptions.includes(option) ? [] : [option];
      onChange({
        selected: true,
        dauer: entry?.dauer || '',
        beschreibung: nextOptions.join(', '),
        selectedOptions: nextOptions,
        tags: [],
      });
      if (nextOptions.length > 0) setIsDropdownOpen(false);
      return;
    }

    const exists = selectedOptions.includes(option);
    const nextOptions = exists
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    
    onChange({
      selected: true,
      dauer: entry?.dauer || '',
      beschreibung: nextOptions.join(', '),
      selectedOptions: nextOptions,
      tags: [],
    });
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextOptions = selectedOptions.filter((o) => o !== option);
    onChange({
      selected: isSelected,
      dauer: entry?.dauer || '',
      beschreibung: nextOptions.join(', '),
      selectedOptions: nextOptions,
      tags: [],
    });
  };

  const handleDauerNumberChange = (months: string) => {
    const sanitized = months.replace(/\D/g, '');
    onChange({
      selected: true,
      dauer: sanitized ? `${sanitized} Monate` : '',
      beschreibung: entry?.beschreibung || '',
      selectedOptions: selectedOptions,
      tags: [],
    });
  };

  return (
    <div
      className={`border rounded-xl transition-all duration-150 ${
        isSelected
          ? 'bg-amber-50/40 border-amber-300 shadow-xs ring-1 ring-amber-400/30'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Primary Tap Area for Tablet */}
      <div className="p-3 sm:p-4 touch-pan-y">
        <div
          role={selectionType === 'single' ? 'radio' : 'checkbox'}
          aria-checked={isSelected}
          tabIndex={0}
          onClick={toggleSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSelect();
            }
          }}
          className="w-full text-left flex items-start gap-3 cursor-pointer touch-pan-y"
        >
          {/* Selection indicator */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 ${selectionType === 'single' ? 'rounded-full' : 'rounded-lg'} flex items-center justify-center shrink-0 border-2 transition-all mt-0.5 ${
              isSelected
                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                : 'bg-slate-50 border-slate-300 text-transparent hover:border-slate-400'
            }`}
          >
            {isSelected && (selectionType === 'single' ? <span className="w-2.5 h-2.5 rounded-full bg-white" /> : <Check className="w-4 h-4 stroke-[3]" />)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {code}
              </span>
              <span
                className={`text-sm sm:text-base font-medium leading-snug ${
                  isSelected ? 'text-slate-900 font-semibold' : 'text-slate-800'
                }`}
              >
                {label}
              </span>
            </div>

            {sublabel && (
              <p className="text-xs text-slate-500 mt-1">{sublabel}</p>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">{description}</p>
            )}

            {/* Structured Duration indicator */}
            {entry?.dauer && !hasDauer && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                  <Clock className="w-3 h-3" /> Dauer: {entry.dauer}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasBeschreibung && isSelected && (
          <div className="mt-3 pt-2.5 border-t border-amber-200/70">
            <label htmlFor={`note-${code}`} className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ergänzende Angaben (optional)
            </label>
            <textarea
              id={`note-${code}`}
              value={entry?.beschreibung || ''}
              onChange={(e) => onChange({ ...entry, selected: true, beschreibung: e.target.value })}
              placeholder={placeholder || 'Beobachtungen, Beispiele oder Kontext...'}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
            />
          </div>
        )}

        {/* Structured numeric Duration Input (Chapter 2 only, no free text) */}
        {hasDauer && isSelected && (
          <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center gap-2.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Gesamtdauer:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="240"
                step="1"
                value={entry?.dauer ? entry.dauer.replace(/\D/g, '') : ''}
                onChange={(e) => handleDauerNumberChange(e.target.value)}
                placeholder="z. B. 12"
                className="w-20 px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 text-center"
              />
              <span className="text-xs font-medium text-slate-600">Monate</span>
            </div>
            {/* Quick-select pills */}
            <div className="hidden sm:flex items-center gap-1 ml-2">
              {['6', '12', '24', '36'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleDauerNumberChange(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    entry?.dauer === `${m} Monate`
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {m} Mon.
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Select Dropdown for chapters like 5.1.1 and 6.1.1 - 6.1.5 */}
        {dropdownOptions && dropdownOptions.length > 0 && (
          <div ref={dropdownRef} className="mt-3 pt-2.5 border-t border-slate-200/80 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>
                  {dropdownSelectionMode === 'single'
                    ? 'Spezifizierung (eine Auswahl):'
                    : 'Spezifizierung (Mehrfachauswahl aus Dropdown):'}
                </span>
                {selectedOptions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    {dropdownSelectionMode === 'single' ? 'Auswahl getroffen' : `${selectedOptions.length} ausgewählt`}
                  </span>
                )}
              </label>

              {/* Dropdown trigger button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isDropdownOpen
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : selectedOptions.length > 0
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>
                  {selectedOptions.length === 0
                    ? 'Dropdown öffnen & Optionen wählen...'
                    : dropdownSelectionMode === 'single'
                      ? '1 Option gewählt'
                      : `${selectedOptions.length} Option${selectedOptions.length > 1 ? 'en' : ''} gewählt`}
                </span>
                {isDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>
            </div>

            {/* Selected options pills preview */}
            {selectedOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-emerald-100/90 text-emerald-900 border border-emerald-300"
                  >
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={(e) => removeOption(opt, e)}
                      title="Entfernen"
                      className="p-0.5 hover:bg-emerald-200 rounded text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown Menu Popup */}
            {isDropdownOpen && (
              <div className="mt-2 bg-white rounded-2xl border border-slate-300 shadow-xl p-2.5 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between border-b border-slate-100">
                  <span>
                    {dropdownSelectionMode === 'single'
                      ? 'Eine Option auswählen'
                      : 'Optionen anklicken zum Auswählen (Mehrfachauswahl)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Fertig
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                  {dropdownOptions.map((opt, idx) => {
                    const isChecked = selectedOptions.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleOption(opt)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer touch-pan-y ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-950 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
