import { KizFormData, StaffMember } from '../types/anamnese';
import { CHAPTERS, IQ_LEVELS, SORGERECHT_OPTIONS, GESUNDHEITSFUERSORGE_OPTIONS } from '../data/kizFormStructure';

export interface ChapterSummaryStat {
  chapterId: number;
  title: string;
  count: number;
  items: { code: string; label: string; dauer?: string; beschreibung?: string; tags?: string[] }[];
}

export function computeFormStatistics(formData: KizFormData): {
  totalMarkedCount: number;
  chapterStats: ChapterSummaryStat[];
} {
  const chapterStats: ChapterSummaryStat[] = [];
  let totalMarkedCount = 0;

  // Chapter 1: Rechtlicher Status
  const rItems: { code: string; label: string; beschreibung?: string }[] = [];
  formData.rechtlicherStatus.sorgerecht.forEach((s) => {
    const opt = SORGERECHT_OPTIONS.find((o) => o.id === s);
    if (opt) rItems.push({ code: 'Sorgerecht', label: opt.label });
  });
  if (formData.rechtlicherStatus.sorgerechtNotiz) {
    rItems.push({ code: 'Sorgerecht-Notiz', label: formData.rechtlicherStatus.sorgerechtNotiz });
  }
  formData.rechtlicherStatus.gesundheitsfuersorge.forEach((g) => {
    const opt = GESUNDHEITSFUERSORGE_OPTIONS.find((o) => o.id === g);
    if (opt) rItems.push({ code: 'Gesundheitsfürsorge', label: opt.label });
  });
  if (formData.rechtlicherStatus.gesundheitsfuersorgeNotiz) {
    rItems.push({ code: 'Gesundheitsfürsorge-Notiz', label: formData.rechtlicherStatus.gesundheitsfuersorgeNotiz });
  }
  if (rItems.length > 0) {
    chapterStats.push({
      chapterId: 1,
      title: '1. Rechtlicher Status',
      count: rItems.length,
      items: rItems,
    });
    totalMarkedCount += rItems.length;
  }

  // Chapters 2 to 7
  const inspectMap: Record<number, Record<string, any>> = {
    2: formData.vorangegangeneHilfen,
    3: formData.schulsituation,
    4: formData.psychosozial,
    5: formData.entwicklungsstand,
    6: formData.symptomatik,
    7: formData.somatisch,
  };

  for (let chId = 2; chId <= 7; chId++) {
    const chapterDef = CHAPTERS.find((c) => c.id === chId);
    if (!chapterDef || !chapterDef.sections) continue;

    const dataObj = inspectMap[chId] || {};
    const markedList: { code: string; label: string; dauer?: string; beschreibung?: string; tags?: string[] }[] = [];

    chapterDef.sections.forEach((sec) => {
      sec.items.forEach((item) => {
        const entry = dataObj[item.code];
        if (entry && entry.selected) {
          markedList.push({
            code: item.code,
            label: item.label,
            dauer: entry.dauer,
            beschreibung: entry.beschreibung,
            tags: entry.tags,
          });
        }
      });
    });

    // Special IQ entry for Chapter 5
    if (chId === 5 && formData.iqSelectedCode) {
      const iqDef = IQ_LEVELS.find((l) => l.code === formData.iqSelectedCode);
      if (iqDef) {
        markedList.push({
          code: iqDef.code,
          label: `Intelligenzniveau: ${iqDef.label}`,
          beschreibung: formData.iqNotiz,
        });
      }
    }

    if (markedList.length > 0) {
      chapterStats.push({
        chapterId: chId,
        title: chapterDef.title,
        count: markedList.length,
        items: markedList,
      });
      totalMarkedCount += markedList.length;
    }
  }

  // Chapter 8: Ergänzungen
  const erg = formData.ergaenzungen;
  const ergItems: { code: string; label: string; beschreibung?: string }[] = [];
  if (erg.freitext) ergItems.push({ code: '8.1', label: 'Beobachtungen & Freitext', beschreibung: erg.freitext });
  if (erg.paedagogischeEinschaetzung) ergItems.push({ code: '8.2', label: 'Pädagogische Einschätzung', beschreibung: erg.paedagogischeEinschaetzung });
  if (erg.angebotsEvaluation) ergItems.push({ code: '8.3', label: 'Evaluation des pädagogischen Angebotes', beschreibung: erg.angebotsEvaluation });
  if (erg.zielvereinbarung) ergItems.push({ code: '8.4', label: 'Zielvereinbarung', beschreibung: erg.zielvereinbarung });
  if (erg.naechsteSchritte) ergItems.push({ code: '8.5', label: 'Nächste Schritte', beschreibung: erg.naechsteSchritte });
  if (erg.verantwortlich) ergItems.push({ code: '8.6', label: 'Verantwortlich', beschreibung: erg.verantwortlich });

  if (ergItems.length > 0) {
    chapterStats.push({
      chapterId: 8,
      title: '8. Ergänzungen & Evaluation des Angebotes',
      count: ergItems.length,
      items: ergItems,
    });
    totalMarkedCount += ergItems.length;
  }

  return { totalMarkedCount, chapterStats };
}

export function generatePlainTextReport(formData: KizFormData, includeNotes: boolean = true): string {
  const { totalMarkedCount, chapterStats } = computeFormStatistics(formData);
  const { stammdaten, ergaenzungen } = formData;

  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('PROTOKOLL: ANAMNESE ZUR STRUKTURIERTEN FALLBEURTEILUNG (KIZ)');
  lines.push('================================================================');
  lines.push(`Chiffre:      ${stammdaten.chiffre || 'Keine Angabe'}`);
  lines.push(`Datum:        ${stammdaten.datum || 'Keine Angabe'}`);
  lines.push(`Kostenträger: ${stammdaten.kostentraeger || 'Keine Angabe'}`);
  lines.push(`Geschlecht:   ${stammdaten.geschlecht || 'Keine Angabe'}`);
  lines.push(`Alter:        ${stammdaten.alterInJahren ? `${stammdaten.alterInJahren} Jahre` : 'Keine Angabe'}`);
  if (stammdaten.fachkraft) lines.push(`Fachkraft:    ${stammdaten.fachkraft}`);
  if (stammdaten.einrichtung) lines.push(`Einrichtung:  ${stammdaten.einrichtung}`);
  lines.push(`Erfasst am:   ${new Date(formData.updatedAt).toLocaleString('de-DE')}`);
  lines.push(`Gesamtzahl dokumentierter Auffälligkeiten / Kriterien: ${totalMarkedCount}`);
  lines.push('----------------------------------------------------------------\n');

  chapterStats.forEach((stat) => {
    lines.push(`\n▶ ${stat.title.toUpperCase()} (${stat.count} Befunde / Kriterien)`);
    lines.push('----------------------------------------------------------------');

    stat.items.forEach((it) => {
      let line = `• [${it.code}] ${it.label}`;
      if (it.dauer) {
        line += ` | Dauer: ${it.dauer}`;
      }
      lines.push(line);

      if (includeNotes && it.beschreibung && it.beschreibung.trim().length > 0) {
        lines.push(`    ↳ Details: ${it.beschreibung.trim()}`);
      }
    });
  });

  if (ergaenzungen.angebotsEvaluation || ergaenzungen.paedagogischeEinschaetzung || ergaenzungen.naechsteSchritte) {
    lines.push('\n================================================================');
    lines.push('FAZIT & EVALUATION DES PÄDAGOGISCHEN ANGEBOTES:');
    lines.push('================================================================');
    if (ergaenzungen.paedagogischeEinschaetzung) {
      lines.push(`Pädagogische Einschätzung:\n${ergaenzungen.paedagogischeEinschaetzung}\n`);
    }
    if (ergaenzungen.angebotsEvaluation) {
      lines.push(`Passgenauigkeit & Evaluation unseres Angebots:\n${ergaenzungen.angebotsEvaluation}\n`);
    }
    if (ergaenzungen.zielvereinbarung) {
      lines.push(`Zielvereinbarung:\n${ergaenzungen.zielvereinbarung}\n`);
    }
    if (ergaenzungen.naechsteSchritte) {
      lines.push(`Nächste Schritte:\n${ergaenzungen.naechsteSchritte}\n`);
    }
    if (ergaenzungen.verantwortlich) {
      lines.push(`Verantwortlich: ${ergaenzungen.verantwortlich}\n`);
    }
  }

  lines.push('\n--- Ende des Protokolls (KIZ-Fallbeurteilung) ---');
  return lines.join('\n');
}

export function buildMailtoUrl(
  recipients: string[],
  formData: KizFormData,
  additionalCoverNote?: string
): string {
  const subject = encodeURIComponent(
    `[KIZ Anamnese] Fallbeurteilung & Evaluation: ${formData.stammdaten.chiffre} (${formData.stammdaten.datum})`
  );

  let body = '';
  if (additionalCoverNote && additionalCoverNote.trim().length > 0) {
    body += `${additionalCoverNote.trim()}\n\n---\n\n`;
  }

  body += generatePlainTextReport(formData, true);

  // Encode with safe fallback for max length
  const to = encodeURIComponent(recipients.join(','));
  return `mailto:${to}?subject=${subject}&body=${encodeURIComponent(body)}`;
}

export function downloadJsonFile(data: any, customFilename?: string) {
  const filename = customFilename || (data && data.stammdaten
    ? `KIZ_Anamnese_${data.stammdaten.chiffre.replace(/[^a-zA-Z0-9_-]/g, '_')}_${data.stammdaten.datum}.json`
    : `KIZ_Export_${Date.now()}.json`);
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
