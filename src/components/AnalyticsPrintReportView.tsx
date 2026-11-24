import React from 'react';
import {
  Building2,
  TrendingUp,
  Calendar,
  Users,
  ShieldCheck,
  Radar,
  Brain,
  FileText,
} from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import {
  AggregatedAnalytics,
  computeRadarProfile,
  computeChapterDrillDown,
  RadarProfileResult,
  ChapterDrillDownResult,
} from '../utils/analyticsHelpers';

export interface AnalyticsReportProps {
  analytics: AggregatedAnalytics;
  analyticsCases: KizFormData[];
  facilityFilter: string;
}

interface StaticRadarSpoke {
  label: string;
  value: number; // 0 to 100
  subValue?: string;
}

/**
 * Reusable print-safe, non-overlapping SVG Radar Chart for DIN A4 reports.
 */
const StaticPrintRadarSvg: React.FC<{
  spokes: StaticRadarSpoke[];
  accentColor?: string;
  fillColor?: string;
  compact?: boolean;
}> = ({
  spokes,
  accentColor = '#059669',
  fillColor = '#10b981',
  compact = false,
}) => {
  if (spokes.length < 3) return null;

  const width = compact ? 440 : 540;
  const height = compact ? 270 : 340;
  const cx = width / 2;
  const cy = height / 2;
  const radius = compact ? 72 : 98;
  const labelOffset = compact ? 16 : 20;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoords = (index: number, val: number, rOffset = 0) => {
    const angle = (Math.PI * 2 * index) / spokes.length - Math.PI / 2;
    const r = radius * (Math.max(0, Math.min(100, val)) / 100) + rOffset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle,
    };
  };

  const polygonPoints = spokes
    .map((s, i) => {
      const { x, y } = getCoords(i, s.value);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto block select-none"
      role="img"
      aria-label="Radar-Diagramm"
    >
      {/* Concentric polygon grid */}
      {levels.map((lvl) => {
        const ringPoints = spokes
          .map((_, i) => {
            const { x, y } = getCoords(i, lvl * 100);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ');
        const isOuter = lvl === 1.0;
        return (
          <g key={lvl}>
            <polygon
              points={ringPoints}
              fill={isOuter ? '#f8fafc' : 'none'}
              stroke={isOuter ? '#cbd5e1' : '#e2e8f0'}
              strokeWidth={isOuter ? 1.2 : 0.8}
              strokeDasharray={isOuter ? undefined : '2.5 2.5'}
            />
            <text
              x={cx + 4}
              y={cy - radius * lvl + 3}
              fontSize={compact ? '7.5' : '8.5'}
              fill="#94a3b8"
              fontFamily="monospace"
              fontWeight="600"
            >
              {Math.round(lvl * 100)}%
            </text>
          </g>
        );
      })}

      {/* Axis spokes */}
      {spokes.map((_, i) => {
        const { x, y } = getCoords(i, 100);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Data Polygon */}
      <polygon
        points={polygonPoints}
        fill={fillColor}
        fillOpacity="0.28"
        stroke={accentColor}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Vertices & clean multi-line labels */}
      {spokes.map((s, i) => {
        const { x, y, angle } = getCoords(i, s.value);
        const { x: lx, y: ly } = getCoords(i, 100, labelOffset);

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        let textAnchor: 'middle' | 'start' | 'end' = 'middle';
        if (cosA > 0.25) textAnchor = 'start';
        else if (cosA < -0.25) textAnchor = 'end';

        // Vertical offset so top/bottom labels never touch the outer ring
        let dyBase = 0;
        if (sinA < -0.75) dyBase = -8;
        else if (sinA > 0.75) dyBase = 8;

        const maxLen = compact ? 20 : 24;
        const cleanLabel =
          s.label.length > maxLen ? s.label.slice(0, maxLen - 1).trim() + '…' : s.label;

        return (
          <g key={`spoke-${i}`}>
            <circle
              cx={x}
              cy={y}
              r={compact ? 3.2 : 4}
              fill={accentColor}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x={lx}
              y={ly + dyBase - 2}
              textAnchor={textAnchor}
              fontSize={compact ? '9' : '10'}
              fontWeight="700"
              fill="#1e293b"
            >
              {cleanLabel}
            </text>
            <text
              x={lx}
              y={ly + dyBase + (compact ? 9 : 10)}
              textAnchor={textAnchor}
              fontSize={compact ? '8.5' : '9.5'}
              fontWeight="700"
              fontFamily="monospace"
              fill={accentColor}
            >
              {s.value}%{s.subValue ? ` (${s.subValue})` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

function buildChapterNarrative(dd: ChapterDrillDownResult): string {
  if (dd.totalCases === 0 || dd.subcategories.length === 0) {
    return 'Für dieses Kapitel liegen derzeit keine auswertbaren Falldaten vor.';
  }
  const sorted = [...dd.subcategories].sort((a, b) => b.prevalencePercentage - a.prevalencePercentage);
  const top1 = sorted[0];
  const top2 = sorted[1];
  const activeCount = sorted.filter((s) => s.totalCasesAffected > 0).length;

  if (top1.totalCasesAffected === 0) {
    return `In diesem Bereich wurden bei den ${dd.totalCases} ausgewerteten Fällen keine spezifischen Belastungsmerkmale markiert.`;
  }

  let text = `Im Bereich „${dd.shortTitle}“ zeigen ${activeCount} von ${dd.subcategories.length} Unterkategorien dokumentierte Befunde. Am häufigsten tritt „${top1.shortLabel}“ mit ${top1.prevalencePercentage}% (${top1.totalCasesAffected} von ${dd.totalCases} Fällen) auf`;
  if (top2 && top2.totalCasesAffected > 0) {
    text += `, gefolgt von „${top2.shortLabel}“ mit ${top2.prevalencePercentage}% (${top2.totalCasesAffected} Fälle).`;
  } else {
    text += '.';
  }
  return text;
}

/**
 * Shared DIN A4 Report Content used identically in both the screen preview modal
 * and the root-level printable view (so preview and printed PDF match 1:1).
 */
export const AnalyticsReportContent: React.FC<AnalyticsReportProps> = ({
  analytics,
  analyticsCases,
  facilityFilter,
}) => {
  const filterDisplayName =
    facilityFilter === 'all'
      ? 'Gesamteinrichtung (Alle Gruppen & Häuser)'
      : facilityFilter.startsWith('parent:')
      ? `Haus: ${facilityFilter.replace('parent:', '')} (alle Gruppen)`
      : facilityFilter;

  const profile: RadarProfileResult = computeRadarProfile(analyticsCases);
  const dimensions = profile.dimensions;
  const sortedDimensions = [...dimensions].sort(
    (a, b) => b.prevalencePercentage - a.prevalencePercentage
  );

  // Drill-downs for all 7 chapters
  const drillDownChapterIds = [3, 4, 5, 6, 7, 2, 1];
  const allChapterDrillDowns = drillDownChapterIds.map((chId) =>
    computeChapterDrillDown(chId, analyticsCases)
  );

  // Cost carrier distribution
  const costCarrierCounts: Record<string, number> = {};
  analyticsCases.forEach((c) => {
    const kt = c.stammdaten?.kostentraeger || 'Keine Angabe';
    costCarrierCounts[kt] = (costCarrierCounts[kt] || 0) + 1;
  });
  const costCarrierDistribution = Object.entries(costCarrierCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      percentage: analytics.totalCases > 0 ? Math.round((count / analytics.totalCases) * 100) : 0,
    }));

  const totalChapterItems = analytics.chapterFrequencies.reduce(
    (acc, ch) => acc + ch.totalItemsSelected,
    0
  );
  const chapterFrequenciesWithPct = analytics.chapterFrequencies.map((ch) => ({
    ...ch,
    percentage:
      totalChapterItems > 0 ? Math.round((ch.totalItemsSelected / totalChapterItems) * 100) : 0,
  }));

  const topCategory = [...chapterFrequenciesWithPct].sort(
    (a, b) => b.totalItemsSelected - a.totalItemsSelected
  )[0];
  const topItem = analytics.topItems[0];
  const topDim1 = sortedDimensions[0];
  const topDim2 = sortedDimensions[1];
  const lowestDim = sortedDimensions[sortedDimensions.length - 1];

  const todayStr = new Date().toLocaleDateString('de-DE');

  // Automated narrative text blocks (Executive Summary)
  const narrativeKohorte = `Im Rahmen der statistischen Kohorten-Analyse für den Bereich „${filterDisplayName}“ wurden zum Stichtag ${todayStr} insgesamt N = ${analytics.totalCases} Fallakten ausgewertet. Davon sind ${analytics.completedCasesCount} Fälle (${analytics.completionRate}%) vollständig evaluiert. Im Durchschnitt wurden pro Fallakte ${analytics.averageItemsPerCase} relevante Kriterien dokumentiert; der Gesamtbelastungs-Index liegt bei ${profile.overallBurdenIndex}%.`;

  const narrativeRadarProfil =
    topDim1 && topDim2
      ? `Das 7-dimensionale Klientenprofil zeigt die stärksten Belastungsausprägungen in den Handlungsfeldern „${topDim1.label}“ (${topDim1.prevalencePercentage}% betroffen, Ø ${topDim1.averageItems} Merkmale/Fall) sowie „${topDim2.label}“ (${topDim2.prevalencePercentage}%, Ø ${topDim2.averageItems} Merkmale/Fall). Vergleichsweise am geringsten ausgeprägt ist der Bereich „${lowestDim?.label || '–'}“ (${lowestDim?.prevalencePercentage ?? 0}%).`
      : 'Es liegen noch keine ausreichenden Daten für eine mehrdimensionale Profilauswertung vor.';

  const narrativeSchwerpunkte =
    topCategory && topItem
      ? `Gemessen an der absoluten Nennungszahl bildet Kapitel „${topCategory.title}“ mit ${topCategory.totalItemsSelected} erfassten Merkmalen (${topCategory.percentage}% aller Einträge) den größten Schwerpunkt. Das am häufigsten verzeichnete Einzelkriterium ist „${topItem.label}“ (${topItem.code}), welches bei ${topItem.percentage}% aller Fälle (${topItem.totalOccurrences} von ${analytics.totalCases}) dokumentiert wurde.`
      : 'Es liegen derzeit keine ausreichenden Item-Daten für eine detaillierte Schwerpunktanalyse vor.';

  const narrativeDemografie =
    analytics.averageAge !== undefined && analytics.averageAge > 0
      ? `Das Durchschnittsalter der untersuchten Kohorte beträgt ${analytics.averageAge} Jahre. Die nachfolgenden Drill-Down-Diagramme und Tabellen schlüsseln die einzelnen Störungsbilder, schulischen Risiken, psychosozialen Belastungsfaktoren sowie Hilfeverläufe detailliert auf.`
      : `Die nachfolgenden Drill-Down-Diagramme und Detailtabellen schlüsseln das Klientenprofil differenziert nach sämtlichen sieben Erhebungsdimensionen auf.`;

  const mainRadarSpokes: StaticRadarSpoke[] = dimensions.map((d) => ({
    label: d.shortLabel,
    value: d.prevalencePercentage,
  }));

  // Color palette per chapter for distinct visual clarity in Drill-Down Radars
  const chapterPalette: Record<number, { accent: string; fill: string; badgeBg: string; badgeText: string }> = {
    3: { accent: '#0284c7', fill: '#38bdf8', badgeBg: 'bg-sky-50', badgeText: 'text-sky-800' },
    4: { accent: '#7c3aed', fill: '#a78bfa', badgeBg: 'bg-violet-50', badgeText: 'text-violet-800' },
    5: { accent: '#0d9488', fill: '#2dd4bf', badgeBg: 'bg-teal-50', badgeText: 'text-teal-800' },
    6: { accent: '#e11d48', fill: '#fb7185', badgeBg: 'bg-rose-50', badgeText: 'text-rose-800' },
    7: { accent: '#d97706', fill: '#fbbf24', badgeBg: 'bg-amber-50', badgeText: 'text-amber-800' },
    2: { accent: '#2563eb', fill: '#60a5fa', badgeBg: 'bg-blue-50', badgeText: 'text-blue-800' },
    1: { accent: '#475569', fill: '#94a3b8', badgeBg: 'bg-slate-100', badgeText: 'text-slate-800' },
  };

  return (
    <div className="font-sans text-slate-900 bg-white space-y-5">
      {/* ================================================================= */}
      {/* SEITE 1: DECKBLATT-HEADER, EXECUTIVE SUMMARY, KPIs & HAUPT-RADAR  */}
      {/* ================================================================= */}
      <div className="space-y-4">
        {/* Official DIN A4 Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded inline-block mb-1.5">
              KIZ-Zentralevaluierung • Statistischer Kohorten- & Profilbericht
            </div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">
              Fall-, Radar- & Drill-Down-Bericht
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Ausgewertete Kohorte:{' '}
              <strong className="text-slate-900">{filterDisplayName}</strong>
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600 font-mono shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div>Stichtag: <strong className="text-slate-900">{todayStr}</strong></div>
            <div>Fallanzahl (N): <strong className="text-slate-900">{analytics.totalCases}</strong></div>
            <div>Belastungs-Index: <strong className="text-emerald-800">{profile.overallBurdenIndex}%</strong></div>
          </div>
        </div>

        {/* Executive Summary Textbausteine */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 print-avoid-break">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Zusammenfassung & Kernfakten (Automatische Textbausteine)</span>
          </h2>
          <div className="space-y-1.5 text-[11.5px] text-slate-700 leading-relaxed">
            <p>• {narrativeKohorte}</p>
            <p>• {narrativeRadarProfil}</p>
            <p>• {narrativeSchwerpunkte}</p>
            <p>• {narrativeDemografie}</p>
          </div>
        </div>

        {/* 4 Key KPI Tiles */}
        <div className="grid grid-cols-4 gap-3 print-avoid-break">
          <div className="border border-slate-300 rounded-xl p-3 bg-white text-center">
            <div className="text-2xl font-black text-slate-900">{analytics.totalCases}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Evaluierte Fälle (N)
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">
              {analytics.completedCasesCount} abgeschlossen ({analytics.completionRate}%)
            </div>
          </div>
          <div className="border border-slate-300 rounded-xl p-3 bg-white text-center">
            <div className="text-2xl font-black text-emerald-700">{profile.overallBurdenIndex}%</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Belastungs-Index
            </div>
            <div className="text-[10px] text-slate-500">Ø Prävalenz über 7 Achsen</div>
          </div>
          <div className="border border-slate-300 rounded-xl p-3 bg-white text-center">
            <div className="text-2xl font-black text-blue-700">{analytics.averageItemsPerCase}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Ø Items / Fallakte
            </div>
            <div className="text-[10px] text-slate-500">{totalChapterItems} Nennungen gesamt</div>
          </div>
          <div className="border border-slate-300 rounded-xl p-3 bg-white text-center">
            <div className="text-2xl font-black text-amber-700">
              {analytics.averageAge !== undefined ? `${analytics.averageAge} J.` : '—'}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Ø Altersdurchschnitt
            </div>
            <div className="text-[10px] text-slate-500">Klientel der Kohorte</div>
          </div>
        </div>

        {/* MAIN VISUAL RADAR CHART (7 DIMENSIONS) + DIMENSION BARS */}
        <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-3 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Radar className="w-4 h-4 text-emerald-700" />
                <span>Visuelles Radar-Gesamtprofil (7 Belastungsdimensionen)</span>
              </h2>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Prävalenz (% der Klienten mit mindestens einem dokumentierten Befund je Bereich)
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              N = {analytics.totalCases}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Radar SVG — wide viewBox guarantees zero label overlap */}
            <div className="col-span-7 flex items-center justify-center">
              <div className="w-full max-w-[390px]">
                <StaticPrintRadarSvg
                  spokes={mainRadarSpokes}
                  accentColor="#059669"
                  fillColor="#10b981"
                />
              </div>
            </div>

            {/* Right: Ranked Dimension Breakdown */}
            <div className="col-span-5 space-y-2 border-l border-slate-100 pl-3">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Belastungsschwerpunkte nach Bereichen
              </div>
              <div className="space-y-2">
                {dimensions.map((d) => (
                  <div key={d.id} className="space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-slate-800 leading-tight">{d.shortLabel}</span>
                      <span className="font-mono font-bold text-emerald-800 shrink-0">
                        {d.prevalencePercentage}%{' '}
                        <span className="text-[9.5px] font-normal text-slate-500">
                          (Ø {d.averageItems})
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${d.prevalencePercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SEITEN 2–5: DRILL-DOWN RADAR-DIAGRAMME & TABELLEN JE KAPITEL      */}
      {/* ================================================================= */}
      {allChapterDrillDowns.map((dd, idx) => {
        const pal = chapterPalette[dd.chapterId] || {
          accent: '#059669',
          fill: '#10b981',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-800',
        };
        const spokes: StaticRadarSpoke[] = dd.subcategories.map((sub) => ({
          label: sub.shortLabel,
          value: sub.prevalencePercentage,
        }));
        const isNewPage = idx % 2 === 0;
        const chapterSummary = buildChapterNarrative(dd);

        return (
          <div
            key={dd.chapterId}
            className={`${isNewPage ? 'print-page-break pt-1' : ''} space-y-2`}
          >
            {idx === 0 && (
              <div className="border-b-2 border-slate-900 pb-1.5 mb-2 flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Radar className="w-4 h-4 text-emerald-700" />
                  <span>Drill-Down-Radarprofile & Detailanalyse aller 7 Themen-Kapitel</span>
                </h2>
                <span className="text-[10px] font-mono text-slate-500">
                  Kohorte: {filterDisplayName} (N = {analytics.totalCases})
                </span>
              </div>
            )}

            <div className="border border-slate-300 rounded-xl p-3.5 bg-white space-y-2.5 print-avoid-break">
              {/* Chapter Card Header */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    {dd.title}
                  </h3>
                  <p className="text-[10px] text-slate-500">{dd.description}</p>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200 shrink-0 ${pal.badgeBg} ${pal.badgeText}`}
                >
                  N = {dd.totalCases}
                </span>
              </div>

              {/* Drill-Down Radar Chart (Left) + Subcategory Table (Right) */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5 flex items-center justify-center bg-slate-50/40 rounded-lg border border-slate-100 p-1">
                  <StaticPrintRadarSvg
                    spokes={spokes}
                    accentColor={pal.accent}
                    fillColor={pal.fill}
                    compact
                  />
                </div>

                <div className="col-span-7">
                  <table className="w-full border-collapse border border-slate-200 text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left">
                        <th className="p-1.5 w-14 border-r border-slate-200 text-center">Code</th>
                        <th className="p-1.5 border-r border-slate-200">Unterkategorie</th>
                        <th className="p-1.5 text-right w-16 border-r border-slate-200">Fälle</th>
                        <th className="p-1.5 text-right w-14">Anteil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dd.subcategories.map((sub) => (
                        <tr key={sub.code} className="border-b border-slate-100">
                          <td className="p-1 font-mono font-bold text-slate-700 text-center border-r border-slate-200">
                            {sub.code}
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <div className="font-semibold text-slate-900 leading-snug">
                              {sub.shortLabel}
                            </div>
                          </td>
                          <td className="p-1 text-right text-slate-600 border-r border-slate-200 font-mono">
                            {sub.totalCasesAffected}/{dd.totalCases}
                          </td>
                          <td
                            className="p-1 text-right font-mono font-bold"
                            style={{ color: pal.accent }}
                          >
                            {sub.prevalencePercentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Automated Textbaustein per chapter */}
              <div className="bg-slate-50 border-l-3 border-emerald-600 px-3 py-1.5 rounded-r text-[10.5px] text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Kurzbewertung: </strong>
                {chapterSummary}
              </div>
            </div>
          </div>
        );
      })}

      {/* ================================================================= */}
      {/* ABSCHLUSS-SEITE: TOP 10 INDIKATOREN, DEMOGRAFIE & FAZIT           */}
      {/* ================================================================= */}
      <div className="print-page-break space-y-4 pt-1">
        <div className="border-b-2 border-slate-900 pb-1.5 flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Top 10 Einzelindikatoren, Demografie & Strukturdaten</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            Stichtag: {todayStr} • N = {analytics.totalCases}
          </span>
        </div>

        {/* Top 10 Most Frequent Individual Items */}
        <div className="border border-slate-300 rounded-xl p-3.5 bg-white space-y-2 print-avoid-break">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Top 10 am häufigsten dokumentierte Einzelindikatoren</span>
          </h3>
          <table className="w-full border-collapse border border-slate-200 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-left">
                <th className="p-1.5 w-11 text-center border-r border-slate-200">Rang</th>
                <th className="p-1.5 w-16 border-r border-slate-200 text-center">Code</th>
                <th className="p-1.5 border-r border-slate-200">Kriterium & Kapitel</th>
                <th className="p-1.5 text-right w-24 border-r border-slate-200">Fälle (N)</th>
                <th className="p-1.5 text-right w-16">Anteil</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topItems.slice(0, 10).map((item, idx) => (
                <tr key={item.code} className="border-b border-slate-100">
                  <td className="p-1.5 text-center font-bold text-slate-500 border-r border-slate-200">
                    #{idx + 1}
                  </td>
                  <td className="p-1.5 font-mono font-bold text-emerald-900 border-r border-slate-200 text-center">
                    {item.code}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <div className="font-semibold text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.chapterTitle}</div>
                  </td>
                  <td className="p-1.5 text-right border-r border-slate-200 font-mono">
                    {item.totalOccurrences} von {analytics.totalCases}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold text-emerald-800">
                    {item.percentage}%
                  </td>
                </tr>
              ))}
              {analytics.topItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-400">
                    Keine Einzelindikatoren dokumentiert.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Demographics 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 print-avoid-break">
          {/* Age Structure */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-1.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Altersstruktur</span>
              </span>
              {analytics.averageAge !== undefined && (
                <span className="font-mono text-emerald-800">Ø {analytics.averageAge} J.</span>
              )}
            </div>
            <div className="space-y-1 text-[11px]">
              {analytics.ageDistribution.map((a) => (
                <div key={a.label} className="flex justify-between">
                  <span className="text-slate-700">{a.label}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {a.count} ({a.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gender & Cost Carriers */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-1.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Geschlechterverteilung</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {analytics.genderDistribution.map((g) => (
                <div key={g.label} className="flex justify-between">
                  <span className="text-slate-700">{g.label}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {g.count} ({g.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* IQ Distribution */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-1.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Brain className="w-3.5 h-3.5 text-emerald-700" />
              <span>Intelligenzniveau (IQ-Kategorien)</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {analytics.iqDistribution
                .filter((q) => q.count > 0)
                .map((q) => (
                  <div key={q.label} className="flex justify-between gap-2">
                    <span className="text-slate-700 truncate">{q.label}</span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {q.count} ({q.percentage}%)
                    </span>
                  </div>
                ))}
              {analytics.iqDistribution.every((q) => q.count === 0) && (
                <div className="text-slate-400">Keine IQ-Kategorien erfasst.</div>
              )}
            </div>
          </div>

          {/* Cost Carriers */}
          <div className="border border-slate-300 rounded-xl p-3 space-y-1.5 bg-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kostenträger (Top 5)</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {costCarrierDistribution.slice(0, 5).map((c) => (
                <div key={c.label} className="flex justify-between gap-2">
                  <span className="text-slate-700 truncate">{c.label}</span>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {c.count} ({c.percentage}%)
                  </span>
                </div>
              ))}
              {costCarrierDistribution.length === 0 && (
                <div className="text-slate-400">Keine Kostenträger erfasst.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 print-avoid-break">
          <span>KIZ-Zentrale Fallverwaltung & Anamnese-Datenbank (Anonymisierte Kohortenauswertung)</span>
          <span>
            Erstellt am {todayStr} • Kohorte: {filterDisplayName}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Root-level printable wrapper rendered exclusively during @media print.
 */
export const AnalyticsPrintReportView: React.FC<AnalyticsReportProps> = (props) => {
  return (
    <div className="hidden print:block w-full bg-white text-slate-900">
      <AnalyticsReportContent {...props} />
    </div>
  );
};
