import React, { useState, useMemo } from 'react';
import { 
  Radar, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  ZoomIn,
  CheckCircle2,
  Filter,
  HelpCircle,
  ListFilter,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { KizFormData } from '../types/anamnese';
import { 
  RadarProfileResult, 
  RadarDimensionScore, 
  RadarSubcategoryScore,
  OptionFrequency,
  StructuredRadarLevelResult,
  computeStructuredRadarProfile,
  computeStructuredRadarLevel
} from '../utils/analyticsHelpers';

interface ClientRadarChartProps {
  cases: KizFormData[];
  activeCase?: KizFormData;
  className?: string;
}

export const ClientRadarChart: React.FC<ClientRadarChartProps> = ({
  cases,
  activeCase,
  className = '',
}) => {
  // Metric toggle: 'prevalence' (% of cases with >= 1 issue) vs 'intensity' (% items density)
  const [metricMode, setMetricMode] = useState<'prevalence' | 'intensity'>('prevalence');
  const [showMetricHelp, setShowMetricHelp] = useState<boolean>(false);
  
  // Single case comparison selection (Standard: '' = Kein Einzelfall-Vergleich)
  const [selectedComparisonCaseId, setSelectedComparisonCaseId] = useState<string>('');
  
  // Navigation: main category -> section -> section details.
  const [drillDownId, setDrillDownId] = useState<string | null>(null);
  const [selectedSectionCode, setSelectedSectionCode] = useState<string | null>(null);

  // Hovered or selected item for deep inspection
  const [hoveredDimensionId, setHoveredDimensionId] = useState<string | null>(null);
  const [hoveredSubcatCode, setHoveredSubcatCode] = useState<string | null>(null);
  const [focusedOptionSubcatCode, setFocusedOptionSubcatCode] = useState<string | null>(null);
  const [hoveredOptionName, setHoveredOptionName] = useState<string | null>(null);
  const [expandedOptionCases, setExpandedOptionCases] = useState<Record<string, boolean>>({});

  const toggleOptionCases = (optName: string) => {
    setExpandedOptionCases((prev) => ({ ...prev, [optName]: !prev[optName] }));
  };

  const comparisonCase = useMemo(() => {
    if (!selectedComparisonCaseId) return undefined;
    return cases.find((c) => c.id === selectedComparisonCaseId);
  }, [cases, selectedComparisonCaseId]);

  // Top-level dimensions follow the requested assessment hierarchy.
  const profile: RadarProfileResult = useMemo(() => {
    return computeStructuredRadarProfile(cases, comparisonCase);
  }, [cases, comparisonCase]);

  // First show sections; selecting one shows its individual items.
  const drillDownResult: StructuredRadarLevelResult | null = useMemo(() => {
    if (!drillDownId) return null;
    return computeStructuredRadarLevel(drillDownId, selectedSectionCode, cases, comparisonCase);
  }, [drillDownId, selectedSectionCode, cases, comparisonCase]);

  const selectSubcategory = (code: string) => {
    if (drillDownResult?.level === 'sections') {
      setSelectedSectionCode(code);
      setHoveredSubcatCode(null);
      setFocusedOptionSubcatCode(null);
      return;
    }
    setHoveredSubcatCode(code);
  };

  const dimensions = profile.dimensions;
  const goBackOneLevel = () => {
    if (selectedSectionCode) setSelectedSectionCode(null);
    else {
      setDrillDownId(null);
      setHoveredDimensionId(null);
    }
    setHoveredSubcatCode(null);
    setFocusedOptionSubcatCode(null);
    setHoveredOptionName(null);
  };

  // Active highlighted top-level dimension
  const activeDimension: RadarDimensionScore | undefined = useMemo(() => {
    if (hoveredDimensionId) {
      return dimensions.find((d) => d.id === hoveredDimensionId);
    }
    return [...dimensions].sort((a, b) => b.prevalencePercentage - a.prevalencePercentage)[0];
  }, [dimensions, hoveredDimensionId]);

  // Active highlighted subcategory in drill-down mode
  const activeSubcategory: RadarSubcategoryScore | undefined = useMemo(() => {
    if (!drillDownResult) return undefined;
    if (hoveredSubcatCode) {
      return drillDownResult.subcategories.find((s) => s.code === hoveredSubcatCode);
    }
    if (focusedOptionSubcatCode) {
      return drillDownResult.subcategories.find((s) => s.code === focusedOptionSubcatCode);
    }
    return [...drillDownResult.subcategories].sort((a, b) => b.prevalencePercentage - a.prevalencePercentage)[0];
  }, [drillDownResult, hoveredSubcatCode, focusedOptionSubcatCode]);

  // Dynamic spokes based on mode: 7 main dimensions OR subcategories OR dropdown options
  const isDrillDown = !!drillDownResult;

  // Focused option subcategory for Level-3 option radar mode
  const focusedOptionSubcat = useMemo(() => {
    if (!drillDownResult || !focusedOptionSubcatCode) return null;
    return drillDownResult.subcategories.find((s) => s.code === focusedOptionSubcatCode) || null;
  }, [drillDownResult, focusedOptionSubcatCode]);

  const isOptionDrillDown = isDrillDown && !!focusedOptionSubcat && (focusedOptionSubcat.optionsFrequencies?.length || 0) > 0;

  // SVG Radar Geometry - generous padding so labels never get cut off on mobile
  const size = 580;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 160;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const activeSpokesCount = isOptionDrillDown
    ? focusedOptionSubcat!.optionsFrequencies!.length
    : isDrillDown
    ? drillDownResult.subcategories.length
    : dimensions.length;

  const getCoordinates = (index: number, value: number, total: number, rOffset = 0) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = radius * (Math.max(0, Math.min(100, value)) / 100) + rOffset;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Top-level polygon points
  const cohortMainPoints = useMemo(() => {
    if (dimensions.length === 0) return '';
    return dimensions
      .map((d, i) => {
        const val = metricMode === 'prevalence' ? d.prevalencePercentage : d.intensityPercentage;
        const { x, y } = getCoordinates(i, val, dimensions.length);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [dimensions, metricMode]);

  const comparisonMainPoints = useMemo(() => {
    if (!comparisonCase || dimensions.length === 0) return null;
    return dimensions
      .map((d, i) => {
        const val = metricMode === 'prevalence' ? (d.singleCasePrevalenceScore ?? 0) : (d.singleCaseScore ?? 0);
        const { x, y } = getCoordinates(i, val, dimensions.length);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [dimensions, comparisonCase, metricMode]);

  // Drill-down polygon points
  const cohortDrillPoints = useMemo(() => {
    if (!drillDownResult || drillDownResult.subcategories.length === 0) return '';
    const total = drillDownResult.subcategories.length;
    return drillDownResult.subcategories
      .map((s, i) => {
        const val = metricMode === 'prevalence' ? s.prevalencePercentage : (s.intensityPercentage ?? 0);
        const { x, y } = getCoordinates(i, val, total);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [drillDownResult, metricMode]);

  const comparisonDrillPoints = useMemo(() => {
    if (!drillDownResult || !comparisonCase || drillDownResult.subcategories.length === 0) return null;
    const total = drillDownResult.subcategories.length;
    return drillDownResult.subcategories
      .map((s, i) => {
        const val = metricMode === 'prevalence' ? (s.singleCasePrevalenceScore ?? 0) : (s.singleCaseScore ?? 0);
        const { x, y } = getCoordinates(i, val, total);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [drillDownResult, comparisonCase, metricMode]);

  // Option-level polygon points (Level 3)
  const cohortOptionPoints = useMemo(() => {
    if (!isOptionDrillDown || !focusedOptionSubcat?.optionsFrequencies) return '';
    const total = focusedOptionSubcat.optionsFrequencies.length;
    return focusedOptionSubcat.optionsFrequencies
      .map((opt, i) => {
        const val = opt.percentage;
        const { x, y } = getCoordinates(i, val, total);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [isOptionDrillDown, focusedOptionSubcat]);

  const comparisonOptionPoints = useMemo(() => {
    if (!isOptionDrillDown || !comparisonCase || !focusedOptionSubcat?.optionsFrequencies) return null;
    const total = focusedOptionSubcat.optionsFrequencies.length;
    return focusedOptionSubcat.optionsFrequencies
      .map((opt, i) => {
        const val = opt.singleCaseHasOption ? 100 : 0;
        const { x, y } = getCoordinates(i, val, total);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [isOptionDrillDown, focusedOptionSubcat, comparisonCase]);

  // Sorted dimensions for narrative summary
  const sortedByBurden = useMemo(() => {
    return [...dimensions].sort((a, b) => b.prevalencePercentage - a.prevalencePercentage);
  }, [dimensions]);

  if (dimensions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500">
        Keine ausreichenden Falldaten für ein Klientenprofil vorhanden.
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Top Header with title and controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Radar className="w-3.5 h-3.5" />
              <span>{isDrillDown ? 'Unterkategorien-Analyse' : 'Klienten-Profil-Analyse'}</span>
            </div>
            {isDrillDown && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                {drillDownResult.shortTitle}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {isDrillDown
              ? drillDownResult.title
              : 'Durchschnittliches Belastungsprofil des Klientels'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            {isDrillDown
              ? drillDownResult.description
              : `Mehrdimensionale Darstellung der Kernbedarfe über alle ${profile.totalCases} dokumentierten Fälle. Zeigt die relative Gewichtung der pädagogischen und klinischen Handlungsfelder.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Back button when in drill-down */}
          {isDrillDown ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button type="button" onClick={() => setMetricMode('prevalence')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${metricMode === 'prevalence' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Prävalenz</button>
                <button type="button" onClick={() => setMetricMode('intensity')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${metricMode === 'intensity' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Intensität</button>
              </div>
              <button type="button" onClick={goBackOneLevel} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                <span>{selectedSectionCode ? 'Zurück zu den Unterbereichen' : 'Zurück zu den 8 Hauptbereichen'}</span>
              </button>
            </div>
          ) : (
            /* Metric Mode Toggle in top view with Help button */
            <div className="flex items-center gap-1.5">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMetricMode('prevalence')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    metricMode === 'prevalence'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Wie viel Prozent aller Fälle weisen mindestens 1 Befund in diesem Bereich auf?"
                >
                  Prävalenz (% betroffen)
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode('intensity')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    metricMode === 'intensity'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Wie viele Merkmale treffen im Schnitt gleichzeitig pro Fall zu?"
                >
                  Intensität (% Schwere)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMetricHelp((prev) => !prev)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  showMetricHelp
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
                }`}
                title="Erklärung: Unterschied zwischen Prävalenz und Intensität anzeigen"
                aria-label="Hilfe zur Metrik"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Comparison Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedComparisonCaseId}
              onChange={(e) => setSelectedComparisonCaseId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">Kein Einzelfall-Vergleich (Standard)</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  Vergleich: {c.stammdaten.chiffre} {c.stammdaten.alterInJahren ? `(${c.stammdaten.alterInJahren} J.)` : ''}
                  {activeCase && activeCase.id === c.id ? ' [Aktiver Fall]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric Explanation Banner */}
      {showMetricHelp && (
        <div className="mx-5 sm:mx-6 my-3 p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              Unterschied: Prävalenz vs. Intensität im Klientenprofil
            </span>
            <button
              type="button"
              onClick={() => setShowMetricHelp(false)}
              className="text-emerald-700 hover:text-emerald-950 p-1 text-xs font-semibold cursor-pointer"
            >
              ✕ Schließen
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs space-y-1">
              <div className="font-bold text-emerald-900 text-xs">
                1. Prävalenz (% der Kinder) = „Wie viele Kinder sind betroffen?“
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Zeigt, wie viel Prozent aller dokumentierten Fälle <strong>überhaupt mindestens einen Eintrag</strong> in diesem Bereich aufweisen.
                <br />
                <em>Beispiel:</em> Wenn 8 von 10 Kindern mindestens ein Schulproblem haben, liegt die Prävalenz bei <strong>80 %</strong>.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs space-y-1">
              <div className="font-bold text-emerald-900 text-xs">
                2. Intensität (% Schwere) = „Wie geballt / multipel sind die Probleme?“
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Zeigt, wie viele Kriterien <strong>im Durchschnitt pro Fall gleichzeitig</strong> zutreffen (im Verhältnis zur maximalen Itemzahl).
                <br />
                <em>Beispiel:</em> Wenn in einem Kapitel 10 Kriterien existieren und betroffene Kinder im Schnitt 2 davon erfüllen, liegt die Intensität bei <strong>20 %</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Quick Filter Tabs / Area Selector Strip */}
      <div className="px-5 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-emerald-600" />
          <span>Bereich wählen:</span>
        </span>

        {/* Option 0: Gesamte Hauptübersicht */}
        <button
          type="button"
          onClick={() => {
            setDrillDownId(null);
            setSelectedSectionCode(null);
            setHoveredSubcatCode(null);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            !drillDownId
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Alle 8 Hauptbereiche
        </button>

        {/* Quick buttons for each chapter */}
        {dimensions.map((d) => {
          const isSelected = drillDownId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setDrillDownId(d.id);
                setSelectedSectionCode(null);
                setHoveredDimensionId(d.id);
                setHoveredSubcatCode(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-900'
              }`}
            >
              <span>{d.shortLabel}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-emerald-950/60 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {d.prevalencePercentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Hint banner */}
      <div className="px-5 py-2.5 bg-emerald-50/60 border-b border-emerald-100 text-xs text-emerald-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            {isDrillDown ? (
              <>
                <strong>{drillDownResult.level === 'sections' ? 'Unterbereiche im Radar aktiv:' : 'Einzelkriterien im Radar aktiv:'}</strong>{' '}
                Auswertung für <strong>{drillDownResult.shortTitle}</strong>. Prävalenz zeigt betroffene Fälle; Intensität mittlere Kriterien pro Fall.
              </>
            ) : (
              <>
                <strong>Interaktiver Drill-Down:</strong> Klicken Sie auf einen Hauptbereich und anschließend auf einen Unterbereich, um dessen Einzelkriterien zu sehen.
              </>
            )}
          </span>
        </div>
        {isDrillDown && (
          <button
            type="button"
            onClick={goBackOneLevel}
            className="text-emerald-800 hover:text-emerald-950 underline font-bold shrink-0 text-xs cursor-pointer"
          >
            {selectedSectionCode ? '← Unterbereiche' : '← Übersicht'}
          </button>
        )}
      </div>

      {/* Main Grid: Radar Chart Visual on Left, Deep-Dive Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 items-center">
        {/* SVG Radar Chart (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[540px] aspect-square relative">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full select-none overflow-visible"
            >
              <defs>
                {/* Emerald gradient for cohort average */}
                <radialGradient id="radarCohortGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.10" />
                </radialGradient>
                {/* Indigo gradient for single comparison case */}
                <radialGradient id="radarCompGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.15" />
                </radialGradient>
                {/* Purple gradient for level 3 options */}
                <radialGradient id="radarOptionGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.12" />
                </radialGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Concentric Polygon Grid Lines & % labels */}
              {levels.map((lvl) => {
                const ringPoints = Array.from({ length: activeSpokesCount })
                  .map((_, i) => {
                    const { x, y } = getCoordinates(i, lvl * 100, activeSpokesCount);
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
                      strokeWidth={isOuter ? 1.5 : 1}
                      strokeDasharray={isOuter ? undefined : '3 3'}
                    />
                    {/* Ring percentage label along the top spoke */}
                    <text
                      x={cx + 6}
                      y={cy - radius * lvl + 3}
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {Math.round(lvl * 100)}%
                    </text>
                  </g>
                );
              })}



              {/* 3. Cohort Average Polygon */}
              {isOptionDrillDown ? (
                cohortOptionPoints && (
                  <polygon
                    points={cohortOptionPoints}
                    fill="url(#radarOptionGrad)"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="transition-all duration-300 drop-shadow-sm"
                  />
                )
              ) : isDrillDown ? (
                cohortDrillPoints && (
                  <polygon
                    points={cohortDrillPoints}
                    fill="url(#radarCohortGrad)"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="transition-all duration-300 drop-shadow-sm"
                  />
                )
              ) : (
                cohortMainPoints && (
                  <polygon
                    points={cohortMainPoints}
                    fill="url(#radarCohortGrad)"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="transition-all duration-300 drop-shadow-sm"
                  />
                )
              )}

              {/* 4. Single Comparison Case Polygon (if active) */}
              {comparisonCase && (
                <polygon
                  points={(isOptionDrillDown ? comparisonOptionPoints : isDrillDown ? comparisonDrillPoints : comparisonMainPoints) || ''}
                  fill="url(#radarCompGrad)"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinejoin="round"
                  className="transition-all duration-300 drop-shadow-sm"
                />
              )}

              {/* 5A. Interactive Vertex Points & Labels: OPTION DRILL-DOWN MODE (Level 3) */}
              {isOptionDrillDown && focusedOptionSubcat?.optionsFrequencies && focusedOptionSubcat.optionsFrequencies.map((opt, i) => {
                const val = opt.percentage;
                const { x, y, angle } = getCoordinates(i, val, activeSpokesCount);
                const { x: lx, y: ly } = getCoordinates(i, 100, activeSpokesCount, 26);
                const isHovered = hoveredOptionName === opt.option;

                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                if (Math.cos(angle) > 0.3) textAnchor = 'start';
                else if (Math.cos(angle) < -0.3) textAnchor = 'end';

                return (
                  <g key={`opt-${opt.option}`}>
                    {/* Vertex Point */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredOptionName(opt.option)}
                      onClick={() => setHoveredOptionName(opt.option)}
                    >
                      {isHovered && (
                        <circle
                          cx={x}
                          cy={y}
                          r="11"
                          fill="#a855f7"
                          fillOpacity="0.25"
                          stroke="#7c3aed"
                          strokeWidth="1.5"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6.5 : 4.5}
                        fill={isHovered ? '#6d28d9' : '#8b5cf6'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    </g>

                    {/* Comparison Case Point if selected */}
                    {comparisonCase && (
                      <circle
                        cx={getCoordinates(i, opt.singleCaseHasOption ? 100 : 0, activeSpokesCount).x}
                        cy={getCoordinates(i, opt.singleCaseHasOption ? 100 : 0, activeSpokesCount).y}
                        r="4"
                        fill="#6366f1"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Option Label */}
                    <g
                      transform={`translate(${lx}, ${ly})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredOptionName(opt.option)}
                      onClick={() => setHoveredOptionName(opt.option)}
                    >
                      <text
                        x={0}
                        y={-4}
                        textAnchor={textAnchor}
                        className={`text-[10px] sm:text-[11px] font-bold select-none transition-colors ${
                          isHovered ? 'fill-purple-900 font-extrabold' : 'fill-slate-800'
                        }`}
                      >
                        {opt.option}
                      </text>
                      <text
                        x={0}
                        y={9}
                        textAnchor={textAnchor}
                        className={`text-[9px] sm:text-[10px] font-mono font-bold select-none ${
                          isHovered ? 'fill-purple-700' : 'fill-slate-500'
                        }`}
                      >
                        {opt.count} Fälle ({opt.percentage}%)
                        {comparisonCase && (
                          <tspan fill="#6366f1" dx="3">
                            {opt.singleCaseHasOption ? '✓ (Fall)' : '–'}
                          </tspan>
                        )}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 5B. Interactive Vertex Points & Labels: SUBCATEGORY DRILL-DOWN MODE (Level 2) */}
              {!isOptionDrillDown && isDrillDown && drillDownResult.subcategories.map((sub, i) => {
                const val = metricMode === 'prevalence' ? sub.prevalencePercentage : (sub.intensityPercentage ?? 0);
                const { x, y, angle } = getCoordinates(i, val, activeSpokesCount);
                const { x: lx, y: ly } = getCoordinates(i, 100, activeSpokesCount, 26);
                const isHovered = hoveredSubcatCode === sub.code;

                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                if (Math.cos(angle) > 0.3) textAnchor = 'start';
                else if (Math.cos(angle) < -0.3) textAnchor = 'end';

                return (
                  <g key={`sub-${sub.code}`}>
                    {/* Vertex Point */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSubcatCode(sub.code)}
                      onClick={() => selectSubcategory(sub.code)}
                    >
                      {isHovered && (
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          fill="#10b981"
                          fillOpacity="0.2"
                          stroke="#059669"
                          strokeWidth="1.5"
                          strokeOpacity="0.5"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4.5}
                        fill={isHovered ? '#047857' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        filter="url(#glow)"
                        className="transition-all duration-150"
                      />
                    </g>

                    {/* Comparison Case Point if selected */}
                    {comparisonCase && (
                      <circle
                        cx={getCoordinates(i, metricMode === 'prevalence' ? (sub.singleCasePrevalenceScore ?? 0) : (sub.singleCaseScore ?? 0), activeSpokesCount).x}
                        cy={getCoordinates(i, metricMode === 'prevalence' ? (sub.singleCasePrevalenceScore ?? 0) : (sub.singleCaseScore ?? 0), activeSpokesCount).y}
                        r="4"
                        fill="#6366f1"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Subcategory Label */}
                    <g
                      transform={`translate(${lx}, ${ly})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSubcatCode(sub.code)}
                      onClick={() => selectSubcategory(sub.code)}
                    >
                      <text
                        x={0}
                        y={-4}
                        textAnchor={textAnchor}
                        className={`text-[10px] sm:text-[11px] font-bold select-none transition-colors ${
                          isHovered ? 'fill-emerald-800 font-extrabold' : 'fill-slate-700'
                        }`}
                      >
                        {sub.shortLabel}
                      </text>
                      <text
                        x={0}
                        y={9}
                        textAnchor={textAnchor}
                        className={`text-[9px] sm:text-[10px] font-mono font-bold select-none ${
                          isHovered ? 'fill-emerald-600' : 'fill-slate-500'
                        }`}
                      >
                        {val}%
                        {comparisonCase && (
                          <tspan fill="#6366f1" dx="3">
                            {metricMode === 'prevalence' ? (sub.singleCasePresent ? '✓ (Fall)' : '–') : `${sub.singleCaseScore ?? 0}% (Fall)`}
                          </tspan>
                        )}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 6. Interactive Vertex Points & Labels: TOP-LEVEL 7 DIMENSIONS MODE */}
              {!isDrillDown && dimensions.map((d, i) => {
                const val = metricMode === 'prevalence' ? d.prevalencePercentage : d.intensityPercentage;
                const { x, y, angle } = getCoordinates(i, val, activeSpokesCount);
                const { x: lx, y: ly } = getCoordinates(i, 100, activeSpokesCount, 26);
                const isHovered = hoveredDimensionId === d.id;

                let textAnchor: 'middle' | 'start' | 'end' = 'middle';
                if (Math.cos(angle) > 0.3) textAnchor = 'start';
                else if (Math.cos(angle) < -0.3) textAnchor = 'end';

                return (
                  <g key={`dim-${d.id}`}>
                    {/* Vertex Point */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDimensionId(d.id)}
                      onClick={() => {
                        setHoveredDimensionId(d.id);
                        setDrillDownId(d.id);
                      }}
                    >
                      <title>{`Klicken für Drill-Down in ${d.label}`}</title>
                      {isHovered && (
                        <circle
                          cx={x}
                          cy={y}
                          r="12"
                          fill="#10b981"
                          fillOpacity="0.2"
                          stroke="#059669"
                          strokeWidth="1.5"
                          strokeOpacity="0.5"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6.5 : 4.5}
                        fill={isHovered ? '#047857' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        filter="url(#glow)"
                        className="transition-all duration-150"
                      />
                    </g>

                    {/* Comparison Case Point */}
                    {comparisonCase && (
                      <circle
                        cx={getCoordinates(i, metricMode === 'prevalence' ? (d.singleCasePrevalenceScore ?? 0) : (d.singleCaseScore ?? 0), activeSpokesCount).x}
                        cy={getCoordinates(i, metricMode === 'prevalence' ? (d.singleCasePrevalenceScore ?? 0) : (d.singleCaseScore ?? 0), activeSpokesCount).y}
                        r="4"
                        fill="#6366f1"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Dimension Label - Click drills down! */}
                    <g
                      transform={`translate(${lx}, ${ly})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDimensionId(d.id)}
                      onClick={() => {
                        setHoveredDimensionId(d.id);
                        setDrillDownId(d.id);
                      }}
                    >
                      <title>Klicken, um Unterkategorien anzuzeigen</title>
                      <text
                        x={0}
                        y={-4}
                        textAnchor={textAnchor}
                        className={`text-[10px] sm:text-[11px] font-bold select-none transition-colors ${
                          isHovered ? 'fill-emerald-800 font-extrabold underline' : 'fill-slate-700 hover:fill-emerald-800'
                        }`}
                      >
                        {d.shortLabel}
                      </text>
                      <text
                        x={0}
                        y={9}
                        textAnchor={textAnchor}
                        className={`text-[9px] sm:text-[10px] font-mono font-bold select-none ${
                          isHovered ? 'fill-emerald-600' : 'fill-slate-500'
                        }`}
                      >
                        {val}%
                        {comparisonCase && d.singleCaseScore !== undefined && (
                          <tspan fill="#6366f1" dx="3">
                            / {metricMode === 'prevalence' ? (d.singleCasePrevalenceScore ?? 0) : d.singleCaseScore}%
                          </tspan>
                        )}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 shadow-xs border border-white"></span>
              <span className="font-semibold text-slate-800">
                Klienten-Durchschnitt ({metricMode === 'prevalence' ? 'Prävalenz' : 'Intensität'})
              </span>
            </div>

            {comparisonCase && (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-xs border border-white"></span>
                <span className="font-semibold text-indigo-700">
                  Vergleich: {comparisonCase.stammdaten.chiffre} {comparisonCase.stammdaten.alterInJahren ? `(${comparisonCase.stammdaten.alterInJahren} J.)` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dimension Inspection Panel & Cohort Profile Narrative (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. DRILL-DOWN SUB-CATEGORY INSPECTION CARD */}
          {isDrillDown && activeSubcategory && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3.5 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-bold">
                    Code: {activeSubcategory.code}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {activeSubcategory.label}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-emerald-700">
                    {metricMode === 'prevalence' ? activeSubcategory.prevalencePercentage : (activeSubcategory.intensityPercentage ?? 0)}%
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {metricMode === 'prevalence' ? 'Prävalenz' : 'Intensität'}
                  </div>
                </div>
              </div>

              {activeSubcategory.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                  {activeSubcategory.description}
                </p>
              )}

              {/* Metric stats grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Betroffene Fälle:</span>
                  <span className="font-bold text-slate-900">
                    {activeSubcategory.totalCasesAffected} von {drillDownResult.totalCases} Fälle ({activeSubcategory.prevalencePercentage}% Prävalenz; {activeSubcategory.intensityPercentage ?? 0}% Intensität)
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Bereich:</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {drillDownResult.shortTitle}
                  </span>
                </div>
              </div>

              {/* Comparison case breakdown if selected */}
              {comparisonCase && (
                <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-indigo-950">
                    <span>Fall {comparisonCase.stammdaten.chiffre}:</span>
                    <span className="text-indigo-700 font-black">
                      {metricMode === 'prevalence'
                        ? (activeSubcategory.singleCasePresent ? 'Vorhanden / Dokumentiert' : 'Nicht dokumentiert')
                        : `${activeSubcategory.singleCaseScore ?? 0}% Intensität`}
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-800">
                    {metricMode === 'intensity'
                      ? `${activeSubcategory.singleCaseCount ?? 0} Kriterien im Vergleichsfall; Ø ${activeSubcategory.averageItems ?? 0} pro Fall.`
                      : activeSubcategory.singleCasePresent
                        ? 'Dieses Kriterium wurde im aktiven Vergleichsfall positiv erfasst.'
                        : 'Dieses Merkmal wurde bei diesem Klienten nicht markiert.'}
                  </div>
                </div>
              )}

              {/* Dropdown Options Frequency Breakdown */}
              {activeSubcategory.optionsFrequencies && activeSubcategory.optionsFrequencies.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-purple-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ListFilter className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-slate-900">
                        Dropdown-Optionen ({activeSubcategory.optionsFrequencies.length} Ausprägungen)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = focusedOptionSubcatCode === activeSubcategory.code ? null : activeSubcategory.code;
                        setFocusedOptionSubcatCode(next);
                        if (next) setHoveredOptionName(null);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        focusedOptionSubcatCode === activeSubcategory.code
                          ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                          : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Radar className="w-3 h-3" />
                      <span>{focusedOptionSubcatCode === activeSubcategory.code ? 'Im Radar aktiv' : 'Im Radar anzeigen'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Spezifische Häufigkeit der Einzelausprägungen über alle {drillDownResult.totalCases} Klienten:
                  </p>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {activeSubcategory.optionsFrequencies.map((opt) => {
                      const isHovered = hoveredOptionName === opt.option;
                      return (
                        <div
                          key={opt.option}
                          onMouseEnter={() => setHoveredOptionName(opt.option)}
                          className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                            isHovered
                              ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-300/40'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 leading-snug">
                              {opt.option}
                            </span>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-xs font-black text-purple-800">
                                {opt.count} {opt.count === 1 ? 'Fall' : 'Fälle'}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1 font-semibold">
                                ({opt.percentage}%)
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                opt.percentage > 40
                                  ? 'bg-purple-600'
                                  : opt.percentage > 15
                                  ? 'bg-emerald-600'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.max(opt.percentage, 4)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>
                              {opt.percentageOfAffected}% der Fälle mit {activeSubcategory.shortLabel}
                            </span>
                            {comparisonCase && (
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                                  opt.singleCaseHasOption
                                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {opt.singleCaseHasOption ? '✓ In Vergleichsfall aktiv' : '○ Nicht dokumentiert'}
                              </span>
                            )}
                          </div>

                          {/* Collapsible Affected Chiffren Chips */}
                          {opt.casesWithOption.length > 0 && (
                            <div className="pt-1 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOptionCases(opt.option);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer py-0.5"
                              >
                                <span>
                                  {expandedOptionCases[opt.option]
                                    ? 'Fälle ausblenden'
                                    : `Fälle anzeigen (${opt.casesWithOption.length})`}
                                </span>
                                {expandedOptionCases[opt.option] ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                              {expandedOptionCases[opt.option] && (
                                <div className="flex flex-wrap items-center gap-1 pt-1.5 animate-in fade-in duration-150">
                                  {opt.casesWithOption.map((chiffre, idx) => (
                                    <span
                                      key={idx}
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                    >
                                      {chiffre}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Back to main view button */}
              <div className="pt-2 flex flex-col gap-1.5">
                {isOptionDrillDown && (
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedOptionSubcatCode(null);
                      setHoveredOptionName(null);
                    }}
                    className="w-full py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Zurück zu Unterkategorien ({drillDownResult.shortTitle})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSectionCode) setSelectedSectionCode(null);
                    else {
                      setDrillDownId(null);
                      setHoveredDimensionId(null);
                    }
                    setHoveredSubcatCode(null);
                    setFocusedOptionSubcatCode(null);
                    setHoveredOptionName(null);
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{selectedSectionCode ? 'Zurück zu den Unterbereichen' : 'Zurück zu den 8 Hauptbereichen'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. TOP-LEVEL DIMENSION CARD */}
          {!isDrillDown && activeDimension && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-bold">
                    {activeDimension.chapterTitle}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {activeDimension.label}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-emerald-700">
                    {metricMode === 'prevalence'
                      ? `${activeDimension.prevalencePercentage}%`
                      : `${activeDimension.intensityPercentage}%`}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {metricMode === 'prevalence' ? 'Prävalenz' : 'Sättigung'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {activeDimension.description}
              </p>

              {/* Drill-down Call to Action Button */}
              <button
                type="button"
                onClick={() => {
                  setDrillDownId(activeDimension.id);
                  setSelectedSectionCode(null);
                  setHoveredSubcatCode(null);
                }}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Unterbereiche im Diagramm anzeigen ({activeDimension.shortLabel})</span>
              </button>

              {/* Metric stats grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Betroffene Klienten:</span>
                  <span className="font-bold text-slate-900">
                    {activeDimension.totalCasesAffected} von {profile.totalCases} ({activeDimension.prevalencePercentage}%)
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] text-slate-500 block">Ø Kriterien / Fall:</span>
                  <span className="font-bold text-slate-900">
                    {activeDimension.averageItems} Merkmale
                  </span>
                </div>
              </div>

              {/* Comparison case breakdown if selected */}
              {comparisonCase && (
                <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-indigo-950">
                    <span>Fall {comparisonCase.stammdaten.chiffre}:</span>
                    <span className="text-indigo-700 font-black">
                      {metricMode === 'prevalence'
                        ? `${activeDimension.singleCasePrevalenceScore ?? 0}% Prävalenz`
                        : `${activeDimension.singleCaseScore ?? 0}% Intensität`}
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-800">
                    {activeDimension.singleCaseCount ?? 0} Kriterien in dieser Dimension dokumentiert.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Subcategory List in Drill-Down mode */}
          {isDrillDown && drillDownResult && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{drillDownResult.level === 'sections' ? 'Unterbereiche' : 'Einzelkriterien'} ({drillDownResult.subcategories.length})</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">Klicken zum Hervorheben</span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {drillDownResult.subcategories.map((sub) => {
                  const isHovered = hoveredSubcatCode === sub.code;
                  return (
                    <button
                      key={sub.code}
                      type="button"
                      onClick={() => selectSubcategory(sub.code)}
                      className={`w-full text-left flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isHovered
                          ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/60'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="truncate pr-2 flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">{sub.code}</span>
                        <span className="truncate">{sub.label}</span>
                        {sub.optionsFrequencies && sub.optionsFrequencies.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 shrink-0">
                            {sub.optionsFrequencies.length} Opt.
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-slate-900">{metricMode === 'prevalence' ? sub.prevalencePercentage : (sub.intensityPercentage ?? 0)}%</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Cohort Summary Cards in Top View */}
          {!isDrillDown && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Diagnostisches Profil-Fazit der Einrichtung</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Die Hauptbelastungsachsen des Klientels liegen im Pilgerhaus Weinheim vor allem in der{' '}
                <strong className="text-slate-900">{sortedByBurden[0]?.label}</strong> ({sortedByBurden[0]?.prevalencePercentage}%) und{' '}
                <strong className="text-slate-900">{sortedByBurden[1]?.label}</strong> ({sortedByBurden[1]?.prevalencePercentage}%).
              </p>

              <div className="space-y-1.5 pt-1">
                {dimensions.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setDrillDownId(d.id);
                      setSelectedSectionCode(null);
                      setHoveredDimensionId(d.id);
                    }}
                    title={`Klicken, um Unterkategorien für ${d.shortLabel} zu öffnen`}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      hoveredDimensionId === d.id ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate pr-2">{d.shortLabel}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-slate-900">{d.prevalencePercentage}%</span>
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
