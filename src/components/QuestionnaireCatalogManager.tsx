import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, ChevronDown, ChevronRight, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { ensureQuestionnaireCatalog, publishQuestionnaireCatalog } from '../lib/firebase';
import { QuestionnaireCatalog } from '../types/anamnese';
import { activeChapters, CatalogChapterDefinition, CatalogItemDefinition, CatalogSectionDefinition } from '../data/catalog';

interface Props {
  adminEmail?: string;
  isAdmin: boolean;
  onBack: () => void;
}

const panelClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100';

function makeId(prefix: string): string {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`}`;
}

function reorder<T>(list: T[], index: number, offset: number): T[] {
  const target = index + offset;
  if (target < 0 || target >= list.length) return list;
  const result = [...list];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

function resequence<T extends { position?: number }>(items: T[]): T[] {
  return items.map((item, position) => ({ ...item, position }));
}

function emptyItem(position: number): CatalogItemDefinition {
  return {
    id: makeId('item'), code: '', label: '', position, inputType: 'checkbox', required: false,
    selectionType: 'multiple', hasBeschreibung: false,
  };
}

function emptySection(position: number): CatalogSectionDefinition {
  return { id: makeId('group'), stableId: makeId('groupkey'), code: '', title: 'Neue Untergruppe', position, items: [] };
}

function emptyChapter(position: number): CatalogChapterDefinition {
  return { id: position + 100, stableId: makeId('chapter'), code: '', slug: makeId('bereich'), title: 'Neuer Hauptbereich', shortTitle: 'Neuer Bereich', badge: '•', subtitle: '', position, sections: [] };
}

function normalizedType(item: CatalogItemDefinition): CatalogItemDefinition['inputType'] {
  if (item.inputType) return item.inputType;
  if (item.dropdownOptions?.length) return 'dropdown';
  if (item.hasBeschreibung) return 'optional-text';
  return item.selectionType === 'single' ? 'radio' : 'checkbox';
}

export const QuestionnaireCatalogManager: React.FC<Props> = ({ adminEmail, isAdmin, onBack }) => {
  const [catalog, setCatalog] = useState<QuestionnaireCatalog | null>(null);
  const [draft, setDraft] = useState<QuestionnaireCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ chapter_schulsituation: true, chapter_rechtlicher_status: true, chapter_vorangegangene_hilfen: true, chapter_psychosozial: true, chapter_neurodivergenz: true, chapter_symptomatik: true, chapter_somatisch: true });
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'chapter' | 'section' | 'item'; chapterId: string; sectionId?: string; itemId?: string; label: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    if (isAdmin) ensureQuestionnaireCatalog().then((value) => {
      if (!mounted) return;
      setCatalog(value);
      setDraft(value);
      setLoading(false);
    }).catch((err: unknown) => {
      if (!mounted) return;
      setError(err instanceof Error ? err.message : 'Katalog konnte nicht geladen werden.');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [isAdmin]);

  const chapters = useMemo(() => draft ? activeChapters(draft) : [], [draft]);
  const dirty = !!catalog && !!draft && JSON.stringify(catalog.chapters) !== JSON.stringify(draft.chapters);

  const updateChapter = (chapterId: string, patch: Partial<CatalogChapterDefinition>) => setDraft((current) => current && ({
    ...current, chapters: current.chapters.map((chapter) => chapter.stableId === chapterId ? { ...chapter, ...patch } : chapter),
  }));
  const updateSection = (chapterId: string, sectionId: string, patch: Partial<CatalogSectionDefinition>) => setDraft((current) => current && ({
    ...current, chapters: current.chapters.map((chapter) => chapter.stableId === chapterId ? {
      ...chapter, sections: chapter.sections?.map((section) => section.id === sectionId ? { ...section, ...patch } : section),
    } : chapter),
  }));
  const updateItem = (chapterId: string, sectionId: string, itemId: string, patch: Partial<CatalogItemDefinition>) => setDraft((current) => current && ({
    ...current, chapters: current.chapters.map((chapter) => chapter.stableId === chapterId ? {
      ...chapter, sections: chapter.sections?.map((section) => section.id === sectionId ? {
        ...section, items: section.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
      } : section),
    } : chapter),
  }));

  const addChapter = () => {
    if (!draft) return;
    const chapter = emptyChapter(draft.chapters.length);
    setDraft({ ...draft, chapters: [...draft.chapters, chapter] });
    setExpanded((value) => ({ ...value, [chapter.stableId]: true }));
    setNotice('Neuer Hauptbereich wurde im Entwurf angelegt.');
  };
  const addSection = (chapterId: string) => {
    if (!draft) return;
    const chapter = draft?.chapters.find((value) => value.stableId === chapterId);
    if (!chapter) return;
    updateChapter(chapterId, { sections: [...(chapter.sections || []), emptySection(chapter.sections?.length || 0)] });
    setExpanded((value) => ({ ...value, [chapterId]: true }));
  };
  const addItem = (chapterId: string, sectionId: string) => {
    const section = draft?.chapters.find((value) => value.stableId === chapterId)?.sections?.find((value) => value.stableId === sectionId);
    if (!section) return;
    updateSection(chapterId, sectionId, { items: [...section.items, emptyItem(section.items.length)] });
    setExpanded((value) => ({ ...value, [chapterId]: true, [sectionId]: true }));
  };

  const moveChapter = (index: number, direction: number) => {
    if (!draft) return;
    const reordered = resequence(reorder(chapters, index, direction));
    const positions = new Map(reordered.map((chapter) => [chapter.stableId, chapter.position]));
    setDraft({
      ...draft,
      chapters: draft.chapters.map((chapter) => {
        const position = positions.get(chapter.stableId || '');
        return position === undefined ? chapter : { ...chapter, position };
      }),
    });
  };
  const moveSection = (chapterId: string, index: number, direction: number) => {
    const chapter = draft?.chapters.find((value) => value.stableId === chapterId);
    if (!chapter?.sections) return;
    const reordered = resequence(reorder(chapter.sections.filter((section) => !section.deleted), index, direction));
    const positions = new Map(reordered.map((section) => [section.stableId, section.position]));
    updateChapter(chapterId, { sections: chapter.sections.map((section) => {
      const position = positions.get(section.stableId);
      return position === undefined ? section : { ...section, position };
    }) });
  };
  const moveItem = (chapterId: string, sectionId: string, index: number, direction: number) => {
    const section = draft?.chapters.find((value) => value.stableId === chapterId)?.sections?.find((value) => value.stableId === sectionId);
    if (!section) return;
    const reordered = resequence(reorder(section.items.filter((item) => !item.deleted), index, direction));
    const positions = new Map(reordered.map((item) => [item.id, item.position]));
    updateSection(chapterId, sectionId, { items: section.items.map((item) => {
      const position = positions.get(item.id);
      return position === undefined ? item : { ...item, position };
    }) });
  };

  const confirmDelete = () => {
    if (!draft || !deleteTarget) return;
    if (deleteTarget.kind === 'chapter') updateChapter(deleteTarget.chapterId, { deleted: true });
    if (deleteTarget.kind === 'section' && deleteTarget.sectionId) updateSection(deleteTarget.chapterId, deleteTarget.sectionId, { deleted: true });
    if (deleteTarget.kind === 'item' && deleteTarget.sectionId && deleteTarget.itemId) updateItem(deleteTarget.chapterId, deleteTarget.sectionId, deleteTarget.itemId, { deleted: true });
    setNotice('Element für den nächsten Katalogstand deaktiviert. Bestehende Fallantworten bleiben erhalten.');
    setDeleteTarget(null);
  };

  const validate = (): string | null => {
    if (!draft) return 'Katalog noch nicht geladen.';
    const codes = new Set<string>();
    const ids = new Set<string>();
    const chapterIds = new Set<number>();
    const chapterCodes = new Set<string>();
    for (const chapter of chapters) {
      if (!chapter.title.trim()) return 'Jeder Hauptbereich benötigt einen Titel.';
      if (!chapter.code.trim()) return `Bitte einen Fachcode für „${chapter.title}“ eingeben.`;
      if (chapterIds.has(chapter.id)) return `Die technische Kapitel-ID ${chapter.id} ist nicht eindeutig.`;
      chapterIds.add(chapter.id);
      if (chapter.code.trim() && chapterCodes.has(chapter.code.trim())) return `Der Fachcode „${chapter.code}“ kommt mehrfach vor.`;
      if (chapter.code.trim()) chapterCodes.add(chapter.code.trim());
      const sectionIds = new Set<string>();
      for (const section of chapter.sections || []) {
        if (!section.title.trim()) return 'Jede Untergruppe benötigt einen Titel.';
        if (!section.code.trim()) return `Bitte einen Fachcode für die Untergruppe „${section.title}“ eingeben.`;
        if (section.code.trim() && sectionIds.has(section.code.trim())) return `Der Fachcode „${section.code}“ kommt mehrfach vor.`;
        if (section.code.trim()) sectionIds.add(section.code.trim());
        for (const item of section.items.filter((entry) => !entry.deleted)) {
          if (!item.label.trim()) return `Bitte eine Bezeichnung für ${item.code || 'ein neues Item'} eingeben.`;
          if (item.code.trim() && codes.has(item.code.trim())) return `Der Fachcode „${item.code}“ kommt mehrfach vor.`;
          if (item.code.trim()) codes.add(item.code.trim());
          const technicalId = item.id || `legacy_${chapter.id}_${section.id}_${item.code}`;
          if (ids.has(technicalId)) return `Die technische ID „${technicalId}“ ist nicht eindeutig.`;
          ids.add(technicalId);
        }
      }
    }
    return null;
  };

  const publish = async () => {
    if (!draft || !catalog) return;
    const issue = validate();
    if (issue) { setError(issue); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const published = await publishQuestionnaireCatalog(draft, adminEmail);
      setCatalog(published); setDraft(published);
      setNotice(`Katalogversion ${published.version} veröffentlicht. Sie wird im Formular nach der noch ausstehenden Antwort-/Auswertungsmigration verwendet.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veröffentlichung fehlgeschlagen.');
    } finally { setSaving(false); }
  };

  if (!isAdmin) return <div className={`${panelClass} text-red-800`}>Nur berechtigte Administratoren können den Fragenkatalog verwalten.</div>;
  if (loading) return <div className="flex items-center justify-center gap-2 p-12 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Katalog wird geladen …</div>;
  if (!catalog || !draft) return <div className={`${panelClass} space-y-3`}><p>{error || 'Der Katalog konnte nicht initialisiert werden.'}</p><button className="rounded-lg bg-slate-800 px-4 py-2 text-white" onClick={onBack}>Zurück</button></div>;

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><button type="button" onClick={onBack} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50" aria-label="Zur Admin-Übersicht"><ArrowLeft className="h-4 w-4" /></button><div><h2 className="text-xl font-bold text-slate-900">Fragenkatalog verwalten</h2><p className="text-sm text-slate-600">Aktive Version {catalog.version} · {chapters.length} Hauptbereiche</p></div></div>
      <div className="flex gap-2"><button type="button" onClick={addChapter} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Plus className="h-4 w-4" /> Hauptbereich</button><button type="button" disabled={!dirty || saving} onClick={publish} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Veröffentlichen …' : 'Änderungen veröffentlichen'}</button></div>
    </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Hinweis:</strong> Der Editor verwaltet den versionierten Katalog. Das Formular und die Auswertungen verwenden bis zur abgeschlossenen Antwort- und Berichtsmigration weiterhin den Bestandskatalog. Veröffentliche Änderungen erscheinen daher noch nicht in laufenden Fragebögen.</div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">Technische IDs und Fachcodes sind getrennt. Verschieben ändert nur die Sortierposition, niemals den Fachcode. Fachcodes sind katalogweit eindeutig. Neue Fragen erhalten eine technische ID automatisch; Fachcodes sind optional.</div>

    <div className="space-y-3">{chapters.map((chapter, chapterIndex) => <section key={chapter.stableId} className={panelClass}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setExpanded((value) => ({ ...value, [chapter.stableId]: !value[chapter.stableId] }))} className="rounded p-1 text-slate-600" aria-label="Bereich ein-/ausklappen">{expanded[chapter.stableId] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
        <span className="min-w-0 flex-1 text-xs font-mono text-slate-500">Technische ID: {chapter.stableId} · Position {chapter.position}</span><label className="text-[11px] text-slate-500">Fachcode<input aria-label="Fachcode des Hauptbereichs" className="ml-1 w-16 rounded border px-1 py-0.5" value={chapter.code} onChange={(event) => updateChapter(chapter.stableId, { code: event.target.value })} /></label>
        <button type="button" onClick={() => moveChapter(chapterIndex, -1)} disabled={chapterIndex === 0} className="rounded border p-1.5 disabled:opacity-30" aria-label="Bereich nach oben"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moveChapter(chapterIndex, 1)} disabled={chapterIndex === chapters.length - 1} className="rounded border p-1.5 disabled:opacity-30" aria-label="Bereich nach unten"><ArrowDown className="h-4 w-4" /></button>
        <button type="button" onClick={() => setDeleteTarget({ kind: 'chapter', chapterId: chapter.stableId, label: chapter.title })} className="rounded p-1.5 text-red-700 hover:bg-red-50" aria-label="Bereich deaktivieren"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Hauptbereich<input className={inputClass} value={chapter.title} onChange={(event) => updateChapter(chapter.stableId, { title: event.target.value })} /></label><label className="text-xs font-semibold text-slate-600">Kurztitel<input className={inputClass} value={chapter.shortTitle} onChange={(event) => updateChapter(chapter.stableId, { shortTitle: event.target.value })} /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Hilfetext / Untertitel<textarea className={inputClass} rows={2} value={chapter.subtitle} onChange={(event) => updateChapter(chapter.stableId, { subtitle: event.target.value })} /></label></div>
      {expanded[chapter.stableId] && <div className="mt-4 space-y-3 border-l-2 border-emerald-100 pl-3">
        {(chapter.sections || []).filter((section) => !section.deleted).map((section, sectionIndex) => <div key={section.stableId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2"><span className="min-w-0 flex-1 text-[11px] text-slate-500">Gruppe · ID {section.stableId} · Pos. {section.position} · Fachcode <input aria-label="Fachcode der Untergruppe" className="inline w-20 rounded border px-1 py-0.5" value={section.code} onChange={(event) => updateSection(chapter.stableId, section.stableId, { code: event.target.value })} /></span><button type="button" onClick={() => moveSection(chapter.stableId, sectionIndex, -1)} disabled={sectionIndex === 0} className="rounded border bg-white p-1 disabled:opacity-30" aria-label="Gruppe nach oben"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveSection(chapter.stableId, sectionIndex, 1)} disabled={sectionIndex === (chapter.sections || []).filter((entry) => !entry.deleted).length - 1} className="rounded border bg-white p-1 disabled:opacity-30" aria-label="Gruppe nach unten"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDeleteTarget({ kind: 'section', chapterId: chapter.stableId, sectionId: section.stableId, label: section.title })} className="rounded p-1 text-red-700" aria-label="Gruppe deaktivieren"><Trash2 className="h-3.5 w-3.5" /></button></div>
          <label className="mt-2 block text-xs font-semibold text-slate-600">Untergruppe<input className={inputClass} value={section.title} onChange={(event) => updateSection(chapter.stableId, section.stableId, { title: event.target.value })} /></label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Auswahlregel<select className={inputClass} value={section.selectionType || 'multiple'} onChange={(event) => updateSection(chapter.stableId, section.stableId, { selectionType: event.target.value as 'single' | 'multiple' })}><option value="multiple">Mehrfachauswahl</option><option value="single">Genau eine Auswahl (Radio)</option></select></label><label className="text-xs font-semibold text-slate-600">Hinweis / Hilfetext<textarea className={inputClass} rows={2} value={section.description || ''} onChange={(event) => updateSection(chapter.stableId, section.stableId, { description: event.target.value })} /></label></div>
          <div className="mt-3 space-y-2">{section.items.filter((item) => !item.deleted).map((item, itemIndex) => <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2"><span className="flex-1 font-mono text-xs text-slate-500">{item.code || 'Ohne Fachcode'} · ID {item.id}</span><button type="button" onClick={() => moveItem(chapter.stableId, section.stableId, itemIndex, -1)} disabled={itemIndex === 0} className="rounded border p-1 disabled:opacity-30" aria-label="Item nach oben"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveItem(chapter.stableId, section.stableId, itemIndex, 1)} disabled={itemIndex === section.items.filter((entry) => !entry.deleted).length - 1} className="rounded border p-1 disabled:opacity-30" aria-label="Item nach unten"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDeleteTarget({ kind: 'item', chapterId: chapter.stableId, sectionId: section.stableId, itemId: item.id, label: item.label || item.code })} className="rounded p-1 text-red-700" aria-label="Item deaktivieren"><Trash2 className="h-3.5 w-3.5" /></button></div>
            <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Fachcode (optional)<input className={inputClass} value={item.code} onChange={(event) => updateItem(chapter.stableId, section.stableId, item.id, { code: event.target.value })} placeholder="z. B. 2.1.1" /></label><label className="text-xs font-semibold text-slate-600">Fragetyp<select className={inputClass} value={normalizedType(item)} onChange={(event) => { const type = event.target.value as CatalogItemDefinition['inputType']; updateItem(chapter.stableId, section.stableId, item.id, { inputType: type, selectionType: type === 'radio' ? 'single' : type === 'checkbox' ? 'multiple' : item.selectionType, hasBeschreibung: type === 'optional-text' }); }}><option value="checkbox">Checkbox / Mehrfachauswahl</option><option value="radio">Radio / Einzelauswahl</option><option value="dropdown">Dropdown</option><option value="text">Reiner Freitext</option><option value="optional-text">Auswahl mit optionalem Freitext</option></select></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Bezeichnung<textarea className={inputClass} rows={2} value={item.label} onChange={(event) => updateItem(chapter.stableId, section.stableId, item.id, { label: event.target.value })} /></label><label className="text-xs font-semibold text-slate-600">Hilfetext<textarea className={inputClass} rows={2} value={item.description || ''} onChange={(event) => updateItem(chapter.stableId, section.stableId, item.id, { description: event.target.value })} /></label><label className="text-xs font-semibold text-slate-600">Platzhalter<input className={inputClass} value={item.placeholder || ''} onChange={(event) => updateItem(chapter.stableId, section.stableId, item.id, { placeholder: event.target.value })} /></label></div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={item.required} onChange={() => updateItem(chapter.stableId, section.stableId, item.id, { required: !item.required })} />Pflichtfeld</label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={!!item.hasBeschreibung} onChange={() => updateItem(chapter.stableId, section.stableId, item.id, { hasBeschreibung: !item.hasBeschreibung })} />Zusatznotiz</label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={!!item.hasDauer} onChange={() => updateItem(chapter.stableId, section.stableId, item.id, { hasDauer: !item.hasDauer })} />Dauer in Monaten</label>
            </div>
            {normalizedType(item) === 'dropdown' && <><label className="mt-2 block text-xs font-semibold text-slate-600">Dropdown-Optionen (eine pro Zeile)<textarea className={inputClass} rows={4} value={(item.dropdownOptions || []).join('\n')} onChange={(event) => updateItem(chapter.stableId, section.stableId, item.id, { dropdownOptions: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })} /></label><label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">Auswahlmodus<select className="rounded border px-2 py-1" value={item.dropdownSelectionMode || 'multiple'} onChange={(event) => updateItem(chapter.stableId, section.stableId, item.id, { dropdownSelectionMode: event.target.value as 'single' | 'multiple' })}><option value="single">Einfachauswahl</option><option value="multiple">Mehrfachauswahl</option></select></label></>}
          </div>)}</div>
          <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => addItem(chapter.stableId, section.stableId)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"><Plus className="h-3.5 w-3.5" /> Item hinzufügen</button></div>
        </div>)}
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => addSection(chapter.stableId)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800"><Plus className="h-3.5 w-3.5" /> Untergruppe hinzufügen</button></div>
      </div>}
    </section>)}</div>

    {dirty && <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-lg"><span className="text-sm font-semibold text-amber-950">Ungespeicherter Entwurf — Fallantworten bleiben unverändert.</span><button type="button" onClick={() => setDraft(catalog)} className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold">Verwerfen</button></div>}

    {deleteTarget && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation"><div role="alertdialog" aria-modal="true" aria-labelledby="catalog-delete-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" /><div><h3 id="catalog-delete-title" className="font-bold text-slate-900">Katalogelement deaktivieren?</h3><p className="mt-2 text-sm text-slate-700">„{deleteTarget.label}“ wird nach Veröffentlichung aus dem aktiven Katalog entfernt. Die Deaktivierung ist versioniert; bestehende Antworten und ältere Fallberichte werden nicht gelöscht.</p></div></div><div className="mt-5 flex justify-end gap-2"><button type="button" autoFocus onClick={() => setDeleteTarget(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Abbrechen</button><button type="button" onClick={confirmDelete} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white">Deaktivieren</button></div></div></div>}
    <div className="sr-only" aria-live="polite">{saving ? 'Katalog wird veröffentlicht' : dirty ? 'Ungespeicherte Änderungen' : 'Alle Änderungen veröffentlicht'}</div>
  </div>;
};