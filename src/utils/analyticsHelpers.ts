import { KizFormData } from '../types/anamnese';
import { 
  CHAPTERS, 
  IQ_LEVELS, 
  SORGERECHT_OPTIONS, 
  GESUNDHEITSFUERSORGE_OPTIONS 
} from '../data/kizFormStructure';

export interface OptionFrequency {
  option: string;
  count: number;
  percentage: number; // 0 to 100% of cohort
  percentageOfAffected: number; // 0 to 100% of cases where parent item was selected
  casesWithOption: string[]; // List of chiffres having this specific option
  singleCaseHasOption?: boolean;
}

export interface ItemStatistic {
  code: string;
  label: string;
  chapterId: number;
  chapterTitle: string;
  sectionTitle?: string;
  totalOccurrences: number;
  percentage: number; // 0 to 100
  casesWithItem: string[]; // List of chiffres having this item
  dropdownOptions?: string[];
  optionsFrequencies?: OptionFrequency[];
}

export interface RadarDimensionScore {
  id: string;
  label: string;
  shortLabel: string;
  chapterId: number;
  chapterTitle: string;
  description: string;
  prevalencePercentage: number; // 0 to 100: % of clients with >= 1 issue in this dimension
  intensityPercentage: number;  // 0 to 100: degree of saturation of items in this category
  averageItems: number;         // average number of marked items in this dimension
  totalCasesAffected: number;   // number of clients affected
  topItemLabel?: string;        // most frequent item in this domain
  singleCaseScore?: number;     // 0 to 100 score for single comparison case
  singleCaseCount?: number;     // items marked in single comparison case
}

export interface RadarProfileResult {
  dimensions: RadarDimensionScore[];
  totalCases: number;
  overallBurdenIndex: number; // 0 - 100 overall burden average
}

export interface RadarSubcategoryScore {
  code: string;
  label: string;
  shortLabel: string;
  sectionTitle?: string;
  prevalencePercentage: number; // 0 to 100% of cohort affected
  totalCasesAffected: number;
  singleCasePresent?: boolean;
  singleCaseScore?: number; // 0 or 100%
  description?: string;
  dropdownOptions?: string[];
  optionsFrequencies?: OptionFrequency[];
}

export interface ChapterDrillDownResult {
  dimensionId: string;
  chapterId: number;
  title: string;
  shortTitle: string;
  description: string;
  totalCases: number;
  subcategories: RadarSubcategoryScore[];
}

export interface AggregatedAnalytics {
  totalCases: number;
  completedCasesCount: number;
  completionRate: number;
  averageItemsPerCase: number;
  averageAge?: number;
  ageDistribution: { label: string; count: number; percentage: number }[];
  genderDistribution: { label: string; count: number; percentage: number }[];
  sorgerechtDistribution: { label: string; count: number; percentage: number }[];
  gesundheitsfuersorgeDistribution: { label: string; count: number; percentage: number }[];
  iqDistribution: { label: string; count: number; percentage: number }[];
  chapterFrequencies: { chapterId: number; title: string; totalItemsSelected: number; avgPerCase: number }[];
  allItems: ItemStatistic[];
  topItems: ItemStatistic[];
  radarProfile: RadarProfileResult;
}

export function computeRadarProfile(cases: KizFormData[], singleCase?: KizFormData): RadarProfileResult {
  const totalCases = cases.length;
  if (totalCases === 0) {
    return {
      dimensions: [],
      totalCases: 0,
      overallBurdenIndex: 0,
    };
  }

  const dimensionsConfig = [
    {
      id: 'school',
      label: 'Schulsituation & Verlauf',
      shortLabel: 'Schulsituation',
      chapterId: 3,
      chapterTitle: '3. Schulsituation & Verlauf',
      description: 'Anteil der Fälle mit dokumentierter schulischer Beeinträchtigung',
      totalItemsInPool: 1,
      countFn: (c: KizFormData) => {
        const sch = c.schulsituation || {};
        const concernCodes = ['3.1.2', '3.1.3', '3.1.4', '3.2.1', '3.2.2', '3.2.3', '3.2.4'];
        return concernCodes.some((code) => !!sch[code]?.selected) || c.schulsituationDetails?.suspensions === true ? 1 : 0;
      },
    },
    {
      id: 'psychosocial',
      label: 'Psychosoziale & Familiäre Belastung',
      shortLabel: 'Psychosozial / Familie',
      chapterId: 4,
      chapterTitle: '4. Psychosoziales Umfeld',
      description: 'Elternkonflikte, Traumata, Verluste, Armut & soziale Isolation',
      totalItemsInPool: 21,
      countFn: (c: KizFormData) => {
        const ps = c.psychosozial || {};
        return Object.values(ps).filter((e) => e && (e.selected || (e.beschreibung && e.beschreibung.trim().length > 0))).length;
      },
    },
    {
      id: 'neuro',
      label: 'Entwicklungsstand & Neurodivergenz',
      shortLabel: 'Neurodivergenz / Autismus',
      chapterId: 5,
      chapterTitle: '5. Entwicklungsstand',
      description: 'Autismus-Spektrum, ADHS, Sprache, Motorik, FASD & IQ-Besonderheiten',
      totalItemsInPool: 6,
      countFn: (c: KizFormData) => {
        const dev = c.entwicklungsstand || {};
        const devItems = Object.values(dev).filter((e) => e && (e.selected || (e.beschreibung && e.beschreibung.trim().length > 0))).length;
        const iqSpecial = c.iqSelectedCode && c.iqSelectedCode !== '5.2.3' ? 1 : 0;
        return devItems + iqSpecial;
      },
    },
    {
      id: 'symptoms',
      label: 'Klinisch-Psychiatrische Symptomatik',
      shortLabel: 'Klinische Symptome',
      chapterId: 6,
      chapterTitle: '6. Symptomatik',
      description: 'Ängste, Depression, Impulsdurchbrüche, Wut & Opposition',
      totalItemsInPool: 20,
      countFn: (c: KizFormData) => {
        const sym = c.symptomatik || {};
        return Object.values(sym).filter((e) => e && (e.selected || (e.beschreibung && e.beschreibung.trim().length > 0))).length;
      },
    },
    {
      id: 'somatic',
      label: 'Somatische & Organische Faktoren',
      shortLabel: 'Somatik & Schlaf',
      chapterId: 7,
      chapterTitle: '7. Somatische Ursachen',
      description: 'Schlafstörungen, somatoforme Schmerzen, Neurologie & chronische Befunde',
      totalItemsInPool: 6,
      countFn: (c: KizFormData) => {
        const som = c.somatisch || {};
        return Object.values(som).filter((e) => e && (e.selected || (e.beschreibung && e.beschreibung.trim().length > 0))).length;
      },
    },
    {
      id: 'priorHelp',
      label: 'Vorangegangene Hilfen & Intensität',
      shortLabel: 'Hilfe-Vorgeschichte',
      chapterId: 2,
      chapterTitle: '2. Vorangegangene Hilfen',
      description: 'Erziehungshilfen (§§ 27 ff.), SGB IX, Schulbegleitung & KJP-Aufenthalte',
      totalItemsInPool: 15,
      countFn: (c: KizFormData) => {
        const hlf = c.vorangegangeneHilfen || {};
        return Object.values(hlf).filter((e) => e && (e.selected || (e.dauer && e.dauer.trim().length > 0))).length;
      },
    },
    {
      id: 'legal',
      label: 'Rechtlicher Status & Schutzbedarf',
      shortLabel: 'Rechtlicher Schutz',
      chapterId: 1,
      chapterTitle: '1. Rechtlicher Status',
      description: 'Sorgerechtseinschränkungen, Vormundschaft & richterliche Anordnungen',
      totalItemsInPool: 4,
      countFn: (c: KizFormData) => {
        const sorge = c.rechtlicherStatus?.sorgerecht || [];
        const ges = c.rechtlicherStatus?.gesundheitsfuersorge || [];
        let count = 0;
        if (sorge.some((s) => s !== 'gemeinsam')) count++;
        if (ges.some((g) => g !== 'sorgeberechtigte')) count++;
        if (c.rechtlicherStatus?.sorgerechtNotiz?.trim()) count++;
        if (c.rechtlicherStatus?.gesundheitsfuersorgeNotiz?.trim()) count++;
        return count;
      },
    },
  ];

  const dimensions: RadarDimensionScore[] = dimensionsConfig.map((cfg) => {
    let affectedCount = 0;
    let totalItemsMarked = 0;

    cases.forEach((c) => {
      const cnt = cfg.countFn(c);
      if (cnt > 0) {
        affectedCount++;
      }
      totalItemsMarked += cnt;
    });

    const prevalencePercentage = Math.round((affectedCount / totalCases) * 100);
    const averageItems = Number((totalItemsMarked / totalCases).toFixed(1));
    const intensityPercentage = Math.min(100, Math.round((averageItems / cfg.totalItemsInPool) * 100));

    let singleCaseScore: number | undefined;
    let singleCaseCount: number | undefined;
    if (singleCase) {
      const scCnt = cfg.countFn(singleCase);
      singleCaseCount = scCnt;
      singleCaseScore = Math.min(100, Math.round((scCnt / cfg.totalItemsInPool) * 100));
    }

    return {
      id: cfg.id,
      label: cfg.label,
      shortLabel: cfg.shortLabel,
      chapterId: cfg.chapterId,
      chapterTitle: cfg.chapterTitle,
      description: cfg.description,
      prevalencePercentage,
      intensityPercentage,
      averageItems,
      totalCasesAffected: affectedCount,
      singleCaseScore,
      singleCaseCount,
    };
  });

  const overallBurdenIndex = Math.round(
    dimensions.reduce((acc, d) => acc + d.prevalencePercentage, 0) / dimensions.length
  );

  return {
    dimensions,
    totalCases,
    overallBurdenIndex,
  };
}

export function caseHasOption(
  caseData: KizFormData,
  chapterId: number,
  itemCode: string,
  option: string
): boolean {
  if (!caseData || !option) return false;

  const inspectMapKeys: Record<number, keyof KizFormData> = {
    2: 'vorangegangeneHilfen',
    3: 'schulsituation',
    4: 'psychosozial',
    5: 'entwicklungsstand',
    6: 'symptomatik',
    7: 'somatisch',
  };

  const key = inspectMapKeys[chapterId];
  if (!key) return false;

  const categoryData = caseData[key] as Record<string, any> | undefined;
  const entry = categoryData?.[itemCode];
  if (!entry || !entry.selected) return false;

  const target = option.trim().toLowerCase();

  // 1. Check in selectedOptions array if available
  if (Array.isArray(entry.selectedOptions)) {
    if (entry.selectedOptions.some((o: string) => o && o.trim().toLowerCase() === target)) {
      return true;
    }
  }

  // 2. Check in beschreibung string (e.g. comma-separated list or substring)
  if (entry.beschreibung) {
    const desc = entry.beschreibung.toLowerCase();
    const parts = desc.split(',').map((p: string) => p.trim());
    if (parts.includes(target) || desc.includes(target)) {
      return true;
    }
  }

  return false;
}

export function computeOptionFrequencies(
  options: string[],
  chapterId: number,
  itemCode: string,
  cases: KizFormData[],
  affectedCount: number,
  singleCase?: KizFormData
): OptionFrequency[] {
  const totalCases = cases.length;

  return options.map((opt) => {
    let count = 0;
    const casesWithOption: string[] = [];

    cases.forEach((c) => {
      if (caseHasOption(c, chapterId, itemCode, opt)) {
        count++;
        casesWithOption.push(c.stammdaten?.chiffre || c.id);
      }
    });

    const percentage = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
    const percentageOfAffected = affectedCount > 0 ? Math.round((count / affectedCount) * 100) : 0;
    const singleCaseHasOption = singleCase ? caseHasOption(singleCase, chapterId, itemCode, opt) : false;

    return {
      option: opt,
      count,
      percentage,
      percentageOfAffected,
      casesWithOption,
      singleCaseHasOption,
    };
  });
}

export function computeChapterDrillDown(
  dimensionIdOrChapterId: string | number,
  cases: KizFormData[],
  singleCase?: KizFormData
): ChapterDrillDownResult {
  const totalCases = cases.length;

  let dimId = String(dimensionIdOrChapterId).toLowerCase();
  if (dimId === '6' || dimId === 'symptomatik') dimId = 'symptoms';
  else if (dimId === '3' || dimId === 'schulsituation') dimId = 'school';
  else if (dimId === '4' || dimId === 'psychosozial') dimId = 'psychosocial';
  else if (dimId === '5' || dimId === 'entwicklungsstand') dimId = 'neuro';
  else if (dimId === '7' || dimId === 'somatisch') dimId = 'somatic';
  else if (dimId === '2' || dimId === 'vorangegangenehilfen') dimId = 'priorHelp';
  else if (dimId === '1' || dimId === 'rechtlicherstatus') dimId = 'legal';

  interface SubcatDef {
    code: string;
    label: string;
    shortLabel: string;
    description: string;
    checkFn: (c: KizFormData) => boolean;
    dropdownOptions?: string[];
  }

  let title = 'Unterkategorien-Analyse';
  let shortTitle = 'Unterkategorien';
  let chapterId = 6;
  let description = 'Detaillierte Ausprägung der einzelnen Unterbereiche und Diagnosen';
  let subcatDefs: SubcatDef[] = [];

  switch (dimId) {
    case 'symptoms':
      chapterId = 6;
      title = '6. Klinisch-Psychiatrische Symptomatik';
      shortTitle = 'Klinische Symptome';
      description = 'Prävalenz differenzierter psychiatrischer Diagnosen (Schizophrenie, Affektive Störungen etc.), Substanzkonsum & Verhaltensmuster';
      subcatDefs = [
        {
          code: '6.1.1',
          label: 'Schizophrenie, schizotype oder wahnhafte Störungen',
          shortLabel: 'Schizophrenie & Wahn',
          description: 'Wahrnehmungsverzerrungen, Wahnideen, schizoaffektive Episoden',
          checkFn: (c) => !!c.symptomatik?.['6.1.1']?.selected,
          dropdownOptions: [
            'Schizophrenie',
            'anhaltende wahnhafte Störungen',
            'psychotische Störungen'
          ],
        },
        {
          code: '6.1.2',
          label: 'Affektive Störungen (Depressionen, Manien)',
          shortLabel: 'Affektive Störungen',
          description: 'Depressive Episoden, Antriebslosigkeit, Affektlabilität, manische Phasen',
          checkFn: (c) => !!c.symptomatik?.['6.1.2']?.selected,
          dropdownOptions: [
            'manische Episode',
            'bipolare affektive Störung',
            'depressive Episode'
          ],
        },
        {
          code: '6.1.3',
          label: 'Angst-, Belastungs- oder somatoforme Störungen',
          shortLabel: 'Angst- & Zwangsstörung',
          description: 'Panikattacken, soziale Ängste, PTBS, Phobien und somatoforme Symptome',
          checkFn: (c) => !!c.symptomatik?.['6.1.3']?.selected,
          dropdownOptions: [
            'soziale Phobie',
            'spezifische Ängste',
            'Panikstörung',
            'Zwangsstörung',
            'Posttraumatische Belastungsstörung',
            'dissoziative Störungen',
            'somatoforme Störungen'
          ],
        },
        {
          code: '6.1.4',
          label: 'Ess- oder Schlafstörungen',
          shortLabel: 'Ess- & Schlafstörung',
          description: 'Anorexie, Bulimie, gravierende Ein- und Durchschlafprobleme',
          checkFn: (c) => !!c.symptomatik?.['6.1.4']?.selected,
          dropdownOptions: [
            'Anorexia nervosa',
            'Bulimia nervosa',
            'Schlafstörungen'
          ],
        },
        {
          code: '6.1.5',
          label: 'Persönlichkeitsstörungen',
          shortLabel: 'Persönlichkeitsstörung',
          description: 'Emotionale Instabilität, Borderline-Muster, Impulskontrollstörungen',
          checkFn: (c) => !!c.symptomatik?.['6.1.5']?.selected,
          dropdownOptions: [
            'emotional instabile Persönlichkeitsstörung (Impulsiver-Typ)',
            'emotional instabile Persönlichkeitsstörung (Borderline-Typ)',
            'histrionische Persönlichkeitsstörung',
            'andere Persönlichkeitsstörungen'
          ],
        },
        {
          code: '6.1.6',
          label: 'Bindungsstörung',
          shortLabel: 'Bindungsstörung',
          description: 'Reaktive Bindungsstörung oder Bindungsstörung mit Enthemmung',
          checkFn: (c) => !!c.symptomatik?.['6.1.6']?.selected,
          dropdownOptions: [
            'Reaktive Bindungsstörung des Kindesalters',
            'Bindungsstörung des Kindesalters mit Enthemmung'
          ],
        },
        {
          code: '6.1.7',
          label: 'Enuresis',
          shortLabel: 'Enuresis',
          description: 'Einnässen tagsüber und/oder nachts',
          checkFn: (c) => !!c.symptomatik?.['6.1.7']?.selected,
          dropdownOptions: [
            'Einnässen tagsüber',
            'Einnässen nachts'
          ],
        },
        {
          code: '6.1.8',
          label: 'Enkopresis',
          shortLabel: 'Enkopresis',
          description: 'Unwillkürlicher oder willentlicher Stuhlabgang an unpassenden Orten',
          checkFn: (c) => !!c.symptomatik?.['6.1.8']?.selected,
        },
        {
          code: '6.2',
          label: 'Spezifizierung: Substanzkonsum (F10–F19)',
          shortLabel: 'Substanzkonsum (Drogen/Alkohol)',
          description: 'Missbrauch von Cannabis, Alkohol, Medikamenten oder harten Drogen',
          checkFn: (c) => {
            const sym = c.symptomatik || {};
            return ['6.2.1', '6.2.2', '6.2.3', '6.2.4', '6.2.5'].some((k) => !!sym[k]?.selected);
          },
        },
        {
          code: '6.3',
          label: 'Störung des Sozialverhaltens (F91)',
          shortLabel: 'Sozialverhalten (F91)',
          description: 'Häufige schwere Wutausbrüche, Zerstörung, Stehlen, Tierquälerei & Aggression',
          checkFn: (c) => {
            const sym = c.symptomatik || {};
            return [
              '6.3.1', '6.3.2', '6.3.3', '6.3.4', '6.3.5', '6.3.6', '6.3.7',
              '6.3.8', '6.3.9', '6.3.10', '6.3.11', '6.3.12', '6.3.13', '6.3.14',
            ].some((k) => !!sym[k]?.selected);
          },
        },
        {
          code: '6.4',
          label: 'Weiteres herausforderndes & aggressives Verhalten',
          shortLabel: 'Herausforderndes Verhalten',
          description: 'Autoaggression, Fremdaggression, Stereotypien & Weglauftendenzen',
          checkFn: (c) => {
            const sym = c.symptomatik || {};
            return ['6.4.1', '6.4.2', '6.4.3', '6.4.4', '6.4.5', '6.4.6'].some((k) => !!sym[k]?.selected);
          },
        },
      ];
      break;

    case 'school':
      chapterId = 3;
      title = '3. Schulsituation & Verlauf';
      shortTitle = 'Schulsituation';
      description = 'Verteilung der aktuellen Schulsituation, der Art des Wegbleibens und des schulischen Verlaufs';
      subcatDefs = [
        ...['3.1.1', '3.1.2', '3.1.3', '3.1.4', '3.1.5', '3.2.1', '3.2.2', '3.2.3', '3.2.4', '3.3.1', '3.3.2', '3.3.3'].map((code) => {
          const item = CHAPTERS.find((chapter) => chapter.id === 3)?.sections?.flatMap((section) => section.items).find((candidate) => candidate.code === code);
          const labels: Record<string, string> = {
            '3.1.1': 'Regulärer Schulbesuch',
            '3.1.2': 'Leichte Beeinträchtigung / unregelmäßiger Besuch',
            '3.1.3': 'Ausgeprägte Fehlzeiten / deutliche Beeinträchtigung',
            '3.1.4': 'Massiver / weitgehender Schulabsentismus',
            '3.1.5': 'Aktuell kein regulärer Schulbesuch / Sonder- oder Ersatzsetting',
          };
          const descriptions: Record<string, string> = {
            '3.1.1': 'Kaum oder keine relevanten Fehlzeiten, Teilnahme weitgehend gegeben',
            '3.1.2': 'Einzelne versäumte Stunden oder Tage, insgesamt noch tragfähig',
            '3.1.3': 'Wiederholte Ausfälle oder spürbare Einschränkung der Teilhabe',
            '3.1.4': 'Überwiegendes bis vollständiges Fernbleiben vom vorgesehenen Unterricht',
            '3.1.5': 'Ruhen der Beschulung, Klinik-/Einrichtungsbeschulung oder stark reduziertes Setting',
          };
          return {
            code,
            label: labels[code] || item?.label || code,
            shortLabel: labels[code] || item?.label || code,
            description: descriptions[code] || item?.description || '',
            checkFn: (c: KizFormData) => !!c.schulsituation?.[code]?.selected,
          };
        }),
        ...[
          { code: 'trend-increasing', label: 'Entwicklungstendenz: zunehmend prekär', trend: 'zunehmend prekär' },
          { code: 'trend-stable', label: 'Entwicklungstendenz: gleichbleibend', trend: 'gleichbleibend' },
          { code: 'trend-fluctuating', label: 'Entwicklungstendenz: schwankend', trend: 'schwankend' },
          { code: 'trend-improving', label: 'Entwicklungstendenz: rückläufig / bessernd', trend: 'rückläufig / bessernd' },
        ].map(({ code, label, trend }) => ({
          code,
          label,
          shortLabel: label.replace('Entwicklungstendenz: ', ''),
          description: 'Entwicklungstendenz der schulischen Situation',
          checkFn: (c: KizFormData) => c.schulsituationDetails?.trend === trend,
        })),
        ...[
          { code: 'suspensions-yes', label: 'Suspendierungen / schulische Ausschlüsse: Ja', shortLabel: 'Suspendierungen: Ja', value: true },
          { code: 'suspensions-no', label: 'Suspendierungen / schulische Ausschlüsse: Nein', shortLabel: 'Suspendierungen: Nein', value: false },
        ].map(({ code, label, shortLabel, value }) => ({
          code,
          label,
          shortLabel,
          description: 'Suspendierungen oder schulische Ausschlüsse',
          checkFn: (c: KizFormData) => c.schulsituationDetails?.suspensions === value,
        })),
      ];
      break;

    case 'psychosocial':
      chapterId = 4;
      title = '4. Psychosoziale Umstände & Umfeld';
      shortTitle = 'Psychosozial / Familie';
      description = 'Familiäre, soziale und zwischenmenschliche Belastungsachsen';
      subcatDefs = [
        {
          code: '4.1',
          label: 'Beziehungsstörungen in der Familie',
          shortLabel: 'Familienbeziehung',
          description: 'Mangel an Wärme, Feindseligkeit, Ablehnung oder Überbehütung',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.1.1', '4.1.2', '4.1.3', '4.1.4'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.2',
          label: 'Psychische Störung / Sucht der Eltern',
          shortLabel: 'Elterliche Erkrankung',
          description: 'Psychiatrische Vorerkrankungen oder Substanzabusus der Eltern',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.2.1', '4.2.2', '4.2.3', '4.2.4'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.3',
          label: 'Unangemessene Erziehungsmethoden',
          shortLabel: 'Erziehungsdefizite',
          description: 'Mangelnde Grenzsetzung, Inkonsistenz, Vernachlässigung',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.3.1', '4.3.2', '4.3.3'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.4',
          label: 'Traumatisierende Erfahrungen & Gewalt',
          shortLabel: 'Trauma & Gewalt',
          description: 'Körperliche, seelische oder sexuelle Gewalt- und Missbrauchserfahrungen',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.4.1', '4.4.2', '4.4.3', '4.4.4'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.5',
          label: 'Chronische familiäre Belastungen & Konflikte',
          shortLabel: 'Familiäre Konflikte',
          description: 'Häufige Paarkonflikte, Trennungskrisen, häusliche Spannungen',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.5.1', '4.5.2', '4.5.3', '4.5.4'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.6',
          label: 'Wohnungsnot, Armut & soziale Benachteiligung',
          shortLabel: 'Ökonomische Not',
          description: 'Beengte Wohnverhältnisse, prekäre Finanzlage, Isolation',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.6.1', '4.6.2', '4.6.3'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.7',
          label: 'Kritische Lebensereignisse & Verluste',
          shortLabel: 'Verlust & Trauer',
          description: 'Tod von Bezugspersonen, schwere Erkrankungen im Umfeld',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.7.1', '4.7.2', '4.7.3'].some((k) => !!p[k]?.selected);
          },
        },
        {
          code: '4.8',
          label: 'Zwischenmenschliche Belastung (Schule/Peers)',
          shortLabel: 'Peer-Belastung',
          description: 'Streitbeziehungen, Sündenbockrolle, Peer-Ausschluss',
          checkFn: (c) => {
            const p = c.psychosozial || {};
            return ['4.8.1', '4.8.2', '4.8.3', '4.8.4'].some((k) => !!p[k]?.selected);
          },
        },
      ];
      break;

    case 'neuro':
      chapterId = 5;
      title = '5. Entwicklungsstand & Neurodivergenz';
      shortTitle = 'Entwicklung & IQ';
      description = 'Differenzierte Entwicklungs- und kognitive Dimensionen';
      subcatDefs = [
        {
          code: '5.1.1',
          label: 'Umschriebene Entwicklungsrückstände (Sprache / Sprechen)',
          shortLabel: 'Sprachentwicklung',
          description: 'F80 Sprachverzögerung, Mutismus, non-verbale Kommunikation',
          checkFn: (c) => !!c.entwicklungsstand?.['5.1.1']?.selected,
          dropdownOptions: [
            'Mutismus',
            'Gebärden',
            'Artikulationsstörung',
            'expressive/rezeptive Sprachstörung',
            'Auditive Verarbeitungs- und Wahrnehmungsstörung'
          ],
        },
        {
          code: '5.1.2',
          label: 'Autismus / Tiefgreifende Entwicklungsstörungen',
          shortLabel: 'Autismus-Spektrum',
          description: 'Autismus-Spektrum, Asperger, atypischer Autismus',
          checkFn: (c) => !!c.entwicklungsstand?.['5.1.2']?.selected,
        },
        {
          code: '5.1.3',
          label: 'Rett-Syndrom / Spezifische Syndrome',
          shortLabel: 'Seltene Syndrome',
          description: 'Genetisch determinierte seltene Entwicklungsstörungen',
          checkFn: (c) => !!c.entwicklungsstand?.['5.1.3']?.selected,
        },
        {
          code: '5.1.4',
          label: 'Überaktive Störung mit Stereotypien',
          shortLabel: 'Stereotypien & ADHS',
          description: 'Motorische Stereotypien, unruhige Verhaltensmuster',
          checkFn: (c) => !!c.entwicklungsstand?.['5.1.4']?.selected,
        },
        {
          code: '5.1.5',
          label: 'Einschränkung motorischer Funktionen nach ICF',
          shortLabel: 'ICF-Motorik',
          description: 'Körperfunktionelle und teilhaberelevante Motorikdefizite',
          checkFn: (c) => !!c.entwicklungsstand?.['5.1.5']?.selected,
        },
        {
          code: '5.2',
          label: 'Intelligenz-Besonderheiten (Abweichender IQ)',
          shortLabel: 'IQ-Besonderheit',
          description: 'Hochbegabung (>129) oder Minderung / Lernbehinderung (<85)',
          checkFn: (c) => !!c.iqSelectedCode && c.iqSelectedCode !== '5.2.3',
        },
      ];
      break;

    case 'somatic':
      chapterId = 7;
      title = '7. Somatische & Organische Ursachen';
      shortTitle = 'Somatik & Schlaf';
      description = 'Körperliche, endokrine und neurologische Befunde';
      subcatDefs = [
        {
          code: '7.1.1',
          label: 'Neurologische Erkrankungen & Epilepsie',
          shortLabel: 'Neurologie / Anfälle',
          description: 'Epilepsie, Zerebralparese, Enzephalitiden, Hirnorganik',
          checkFn: (c) => !!c.somatisch?.['7.1.1']?.selected,
        },
        {
          code: '7.2.1',
          label: 'Schilddrüsenerkrankungen',
          shortLabel: 'Schilddrüse',
          description: 'Hyper-/Hypothyreose mit Auswirkung auf Psyche und Antrieb',
          checkFn: (c) => !!c.somatisch?.['7.2.1']?.selected,
        },
        {
          code: '7.2.2',
          label: 'M. Cushing / Hyperkortisolismus',
          shortLabel: 'Kortisol / Cushing',
          description: 'Endokrine Labilität, Steroideinflüsse',
          checkFn: (c) => !!c.somatisch?.['7.2.2']?.selected,
        },
        {
          code: '7.2.3',
          label: 'Diabetes mellitus & Stoffwechselentgleisungen',
          shortLabel: 'Diabetes / Stoffwechsel',
          description: 'Hypoglykämien mit Verhaltensauswirkungen',
          checkFn: (c) => !!c.somatisch?.['7.2.3']?.selected,
        },
        {
          code: '7.3.1',
          label: 'Genetische Syndrome (Trisomie 21, FASD, Prader-Willi)',
          shortLabel: 'Genetik / FASD',
          description: 'Fetales Alkoholsyndrom, Trisomie 21, Chromosomenanomalien',
          checkFn: (c) => !!c.somatisch?.['7.3.1']?.selected,
        },
        {
          code: '7.3.2',
          label: 'Chronische Infektionen & Entzündungen',
          shortLabel: 'Chron. Infektionen',
          description: 'Autoimmunerkrankungen, chronische Schmerzzustände',
          checkFn: (c) => !!c.somatisch?.['7.3.2']?.selected,
        },
      ];
      break;

    case 'priorHelp':
      chapterId = 2;
      title = '2. Vorangegangene Hilfen & Maßnahmen';
      shortTitle = 'Hilfe-Vorgeschichte';
      description = 'Bisherige Inanspruchnahme von Hilfen zur Erziehung und Therapien';
      subcatDefs = [
        {
          code: '2.1',
          label: 'Ambulante Hilfen zur Erziehung (§§ 27-31)',
          shortLabel: 'Ambulante Hilfen',
          description: 'Erziehungsberatung, SPFH, Erziehungsbeistandschaften',
          checkFn: (c) => {
            const h = c.vorangegangeneHilfen || {};
            return ['2.1.1', '2.1.2', '2.1.3'].some((k) => !!h[k]?.selected);
          },
        },
        {
          code: '2.2',
          label: 'Teilstationäre Hilfen / Tagesgruppe (§ 32)',
          shortLabel: 'Tagesgruppen',
          description: 'Frühere Tagesgruppenbetreuung oder heilpädagogische Tagesstätte',
          checkFn: (c) => {
            const h = c.vorangegangeneHilfen || {};
            return ['2.2.1', '2.2.2'].some((k) => !!h[k]?.selected);
          },
        },
        {
          code: '2.3',
          label: 'Stationäre Hilfen / Wohngruppe (§ 34 / 35)',
          shortLabel: 'Stationäre Hilfen',
          description: 'Heimerziehung, Intensivwohngruppe oder Pflegefamilie',
          checkFn: (c) => {
            const h = c.vorangegangeneHilfen || {};
            return ['2.3.1', '2.3.2', '2.3.3'].some((k) => !!h[k]?.selected);
          },
        },
        {
          code: '2.4',
          label: 'Eingliederungshilfe (§ 35a SGB VIII / SGB IX)',
          shortLabel: 'Eingliederungshilfe',
          description: 'Schulbegleitung, Autismus-Therapie, Integrationshilfe',
          checkFn: (c) => {
            const h = c.vorangegangeneHilfen || {};
            return ['2.4.1', '2.4.2'].some((k) => !!h[k]?.selected);
          },
        },
        {
          code: '2.5',
          label: 'KJP-Klinikaufenthalte & Psychiatrische Versorgung',
          shortLabel: 'KJP-Aufenthalte',
          description: 'Kinder- und Jugendpsychiatrie stationär oder teilstationär',
          checkFn: (c) => {
            const h = c.vorangegangeneHilfen || {};
            return ['2.5.1', '2.5.2', '2.5.3'].some((k) => !!h[k]?.selected);
          },
        },
      ];
      break;

    case 'legal':
    default:
      dimId = 'legal';
      chapterId = 1;
      title = '1. Rechtlicher Status & Sorgerecht';
      shortTitle = 'Rechtlicher Schutz';
      description = 'Sorgerechtliche Einschränkungen und Schutzanordnungen';
      subcatDefs = [
        {
          code: 'gemeinsam',
          label: 'Gemeinsame elterliche Sorge (Regelfall)',
          shortLabel: 'Gemeinsame Sorge',
          description: 'Beide Eltern sorgeberechtigt',
          checkFn: (c) => (c.rechtlicherStatus?.sorgerecht || []).includes('gemeinsam'),
        },
        {
          code: 'alleinig_mutter',
          label: 'Alleinige Sorge Mutter',
          shortLabel: 'Alleinige Mutter',
          description: 'Mutter alleinige Inhaberin der elterlichen Sorge',
          checkFn: (c) => (c.rechtlicherStatus?.sorgerecht || []).includes('alleinig_mutter'),
        },
        {
          code: 'alleinig_vater',
          label: 'Alleinige Sorge Vater',
          shortLabel: 'Alleiniger Vater',
          description: 'Vater alleiniger Inhaber der elterlichen Sorge',
          checkFn: (c) => (c.rechtlicherStatus?.sorgerecht || []).includes('alleinig_vater'),
        },
        {
          code: 'vormundschaft',
          label: 'Vormundschaft / Amtspflege (Jugendamt)',
          shortLabel: 'Vormundschaft',
          description: 'Amtspflegschaft oder Vormundschaft durch das Jugendamt',
          checkFn: (c) => (c.rechtlicherStatus?.sorgerecht || []).includes('vormundschaft'),
        },
        {
          code: 'teilentzug_gesundheit',
          label: 'Teilentzug Gesundheitsfürsorge',
          shortLabel: 'Gesundheits-Entzug',
          description: 'Gesundheitsfürsorge gerichtlich entzogen oder übertragen',
          checkFn: (c) => (c.rechtlicherStatus?.gesundheitsfuersorge || []).includes('teilentzug'),
        },
        {
          code: 'anordnung',
          label: 'Gerichtliche einstweilige Anordnung',
          shortLabel: 'Gerichtl. Anordnung',
          description: 'Akute richterliche Beschlüsse oder Auflagen',
          checkFn: (c) => (c.rechtlicherStatus?.gesundheitsfuersorge || []).includes('anordnung'),
        },
      ];
      break;
  }

  const subcategories: RadarSubcategoryScore[] = subcatDefs.map((def) => {
    let affectedCount = 0;
    cases.forEach((c) => {
      if (def.checkFn(c)) affectedCount++;
    });

    const prevalencePercentage = totalCases > 0 ? Math.round((affectedCount / totalCases) * 100) : 0;
    const singleCasePresent = singleCase ? def.checkFn(singleCase) : false;
    const singleCaseScore = singleCasePresent ? 100 : 0;

    const optionsFrequencies = def.dropdownOptions && def.dropdownOptions.length > 0
      ? computeOptionFrequencies(def.dropdownOptions, chapterId, def.code, cases, affectedCount, singleCase)
      : undefined;

    return {
      code: def.code,
      label: def.label,
      shortLabel: def.shortLabel,
      description: def.description,
      prevalencePercentage,
      totalCasesAffected: affectedCount,
      singleCasePresent,
      singleCaseScore,
      dropdownOptions: def.dropdownOptions,
      optionsFrequencies,
    };
  });

  return {
    dimensionId: dimId,
    chapterId,
    title,
    shortTitle,
    description,
    totalCases,
    subcategories,
  };
}

export function computeAggregatedAnalytics(cases: KizFormData[]): AggregatedAnalytics {
  const totalCases = cases.length;
  if (totalCases === 0) {
    return {
      totalCases: 0,
      completedCasesCount: 0,
      completionRate: 0,
      averageItemsPerCase: 0,
      ageDistribution: [],
      genderDistribution: [],
      sorgerechtDistribution: [],
      gesundheitsfuersorgeDistribution: [],
      iqDistribution: [],
      chapterFrequencies: [],
      allItems: [],
      topItems: [],
      radarProfile: { dimensions: [], totalCases: 0, overallBurdenIndex: 0 },
    };
  }

  // 1. Age Cohorts & Average Age
  let totalAgeSum = 0;
  let validAgeCount = 0;
  const ageCohortCounts: Record<string, number> = {
    'Unter 6 Jahre': 0,
    '6–10 Jahre': 0,
    '11–14 Jahre': 0,
    '15–18 Jahre': 0,
    'Über 18 Jahre': 0,
  };
  let noAgeCount = 0;

  cases.forEach((c) => {
    const raw = c.stammdaten?.alterInJahren;
    const num = raw !== undefined && raw !== '' ? Number(raw) : NaN;
    if (!isNaN(num) && num >= 0) {
      totalAgeSum += num;
      validAgeCount++;
      if (num < 6) ageCohortCounts['Unter 6 Jahre']++;
      else if (num <= 10) ageCohortCounts['6–10 Jahre']++;
      else if (num <= 14) ageCohortCounts['11–14 Jahre']++;
      else if (num <= 18) ageCohortCounts['15–18 Jahre']++;
      else ageCohortCounts['Über 18 Jahre']++;
    } else {
      noAgeCount++;
    }
  });

  const averageAge = validAgeCount > 0 ? Number((totalAgeSum / validAgeCount).toFixed(1)) : undefined;

  const ageDistribution = Object.entries(ageCohortCounts)
    .filter(([_, count]) => count > 0 || totalCases <= 4)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / totalCases) * 100),
    }));

  if (noAgeCount > 0) {
    ageDistribution.push({
      label: 'Ohne Altersangabe',
      count: noAgeCount,
      percentage: Math.round((noAgeCount / totalCases) * 100),
    });
  }

  // 2. Gender distribution
  const genderCounts: Record<string, number> = {};
  cases.forEach((c) => {
    const g = c.stammdaten.geschlecht || 'nicht angegeben';
    genderCounts[g] = (genderCounts[g] || 0) + 1;
  });
  const genderDistribution = Object.entries(genderCounts).map(([label, count]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    count,
    percentage: Math.round((count / totalCases) * 100),
  }));

  // 3. Rechtlicher Status: Sorgerecht
  const sorgerechtCounts: Record<string, number> = {};
  cases.forEach((c) => {
    const list = c.rechtlicherStatus?.sorgerecht || [];
    list.forEach((val) => {
      sorgerechtCounts[val] = (sorgerechtCounts[val] || 0) + 1;
    });
  });
  const sorgerechtDistribution = SORGERECHT_OPTIONS.map((opt) => {
    const count = sorgerechtCounts[opt.id] || 0;
    return {
      label: opt.label,
      count,
      percentage: Math.round((count / totalCases) * 100),
    };
  });

  // 3. Rechtlicher Status: Gesundheitsfürsorge
  const gesCounts: Record<string, number> = {};
  cases.forEach((c) => {
    const list = c.rechtlicherStatus?.gesundheitsfuersorge || [];
    list.forEach((val) => {
      gesCounts[val] = (gesCounts[val] || 0) + 1;
    });
  });
  const gesundheitsfuersorgeDistribution = GESUNDHEITSFUERSORGE_OPTIONS.map((opt) => {
    const count = gesCounts[opt.id] || 0;
    return {
      label: opt.label,
      count,
      percentage: Math.round((count / totalCases) * 100),
    };
  });

  // 4. IQ distribution (Chapter 5)
  const iqCounts: Record<string, number> = {};
  cases.forEach((c) => {
    if (c.iqSelectedCode) {
      iqCounts[c.iqSelectedCode] = (iqCounts[c.iqSelectedCode] || 0) + 1;
    }
  });
  const iqDistribution = IQ_LEVELS.map((lvl) => {
    const count = iqCounts[lvl.code] || 0;
    return {
      label: lvl.label,
      count,
      percentage: Math.round((count / totalCases) * 100),
    };
  });

  // 5. Item occurrences across chapters 2..7
  const inspectMapKeys: Record<number, keyof KizFormData> = {
    2: 'vorangegangeneHilfen',
    3: 'schulsituation',
    4: 'psychosozial',
    5: 'entwicklungsstand',
    6: 'symptomatik',
    7: 'somatisch',
  };

  const itemStatsMap = new Map<string, ItemStatistic>();
  const chapterSelectionTotals: Record<number, number> = {
    2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0
  };

  // Seed item map from CHAPTERS structure
  for (let chId = 2; chId <= 7; chId++) {
    const chDef = CHAPTERS.find((c) => c.id === chId);
    if (!chDef || !chDef.sections) continue;

    chDef.sections.forEach((sec) => {
      sec.items.forEach((item) => {
        itemStatsMap.set(item.code, {
          code: item.code,
          label: item.label,
          chapterId: chId,
          chapterTitle: chDef.shortTitle,
          sectionTitle: sec.title,
          totalOccurrences: 0,
          percentage: 0,
          casesWithItem: [],
          dropdownOptions: item.dropdownOptions,
        });
      });
    });
  }

  const schoolDetailStats = [
    ...[
      { code: 'school-trend-increasing', label: 'Entwicklungstendenz: zunehmend prekär', matches: (c: KizFormData) => c.schulsituationDetails?.trend === 'zunehmend prekär' },
      { code: 'school-trend-stable', label: 'Entwicklungstendenz: gleichbleibend', matches: (c: KizFormData) => c.schulsituationDetails?.trend === 'gleichbleibend' },
      { code: 'school-trend-fluctuating', label: 'Entwicklungstendenz: schwankend', matches: (c: KizFormData) => c.schulsituationDetails?.trend === 'schwankend' },
      { code: 'school-trend-improving', label: 'Entwicklungstendenz: rückläufig / bessernd', matches: (c: KizFormData) => c.schulsituationDetails?.trend === 'rückläufig / bessernd' },
      { code: 'school-suspensions-yes', label: 'Suspendierungen / schulische Ausschlüsse: Ja', matches: (c: KizFormData) => c.schulsituationDetails?.suspensions === true },
      { code: 'school-suspensions-no', label: 'Suspendierungen / schulische Ausschlüsse: Nein', matches: (c: KizFormData) => c.schulsituationDetails?.suspensions === false },
    ],
  ];
  schoolDetailStats.forEach(({ code, label }) => itemStatsMap.set(code, {
    code,
    label,
    chapterId: 3,
    chapterTitle: '3. Schulsituation & Verlauf',
    sectionTitle: '3.1 Aktuelle Schulsituation (Schweregrad & Präsenz)',
    totalOccurrences: 0,
    percentage: 0,
    casesWithItem: [],
  }));

  let totalItemsMarkedAcrossAll = 0;
  let completedCount = 0;

  cases.forEach((c) => {
    let caseItemCount = 0;

    // Check completion heuristically (e.g., lastChapterId >= 8 or freitext/stammdaten filled)
    if (c.lastChapterId && c.lastChapterId >= 8) {
      completedCount++;
    } else if (c.ergaenzungen?.paedagogischeEinschaetzung || c.ergaenzungen?.zielvereinbarung) {
      completedCount++;
    }

    for (let chId = 2; chId <= 7; chId++) {
      const dataField = inspectMapKeys[chId];
      const dataObj = (c[dataField] as Record<string, any>) || {};

      Object.entries(dataObj).forEach(([code, entry]) => {
        if (entry && entry.selected) {
          caseItemCount++;
          chapterSelectionTotals[chId] = (chapterSelectionTotals[chId] || 0) + 1;
          const stat = itemStatsMap.get(code);
          if (stat) {
            stat.totalOccurrences += 1;
            stat.casesWithItem.push(c.stammdaten?.chiffre || c.id);
          }
        }
      });
    }

    schoolDetailStats.forEach(({ code, matches }) => {
      if (!matches(c)) return;
      const stat = itemStatsMap.get(code);
      if (stat) {
        stat.totalOccurrences++;
        stat.casesWithItem.push(c.stammdaten?.chiffre || c.id);
      }
    });

    totalItemsMarkedAcrossAll += caseItemCount;
  });

  // Calculate percentages and option frequencies for each item
  const allItems: ItemStatistic[] = [];
  itemStatsMap.forEach((stat) => {
    stat.percentage = totalCases > 0 ? Math.round((stat.totalOccurrences / totalCases) * 100) : 0;
    if (stat.dropdownOptions && stat.dropdownOptions.length > 0) {
      stat.optionsFrequencies = computeOptionFrequencies(
        stat.dropdownOptions,
        stat.chapterId,
        stat.code,
        cases,
        stat.totalOccurrences
      );
    }
    allItems.push(stat);
  });

  // Sort by highest occurrences first
  allItems.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

  const topItems = allItems.filter((i) => i.totalOccurrences > 0).slice(0, 15);

  const chapterFrequencies = [2, 3, 4, 5, 6, 7].map((chId) => {
    const chDef = CHAPTERS.find((c) => c.id === chId);
    const total = chapterSelectionTotals[chId] || 0;
    return {
      chapterId: chId,
      title: chDef ? chDef.shortTitle : `Kapitel ${chId}`,
      totalItemsSelected: total,
      avgPerCase: Number((total / totalCases).toFixed(1)),
    };
  });

  return {
    totalCases,
    completedCasesCount: completedCount,
    completionRate: Math.round((completedCount / totalCases) * 100),
    averageItemsPerCase: Number((totalItemsMarkedAcrossAll / totalCases).toFixed(1)),
    averageAge,
    ageDistribution,
    genderDistribution,
    sorgerechtDistribution,
    gesundheitsfuersorgeDistribution,
    iqDistribution,
    chapterFrequencies,
    allItems,
    topItems,
    radarProfile: computeRadarProfile(cases),
  };
}

export function generateCsvExport(analytics: AggregatedAnalytics, cases: KizFormData[]): string {
  const lines: string[] = [];
  lines.push('KIZ ANAMNESE GESAMTAUSWERTUNG - STATISTISCHER BERICHT');
  lines.push(`Erstellt am:;${new Date().toLocaleString('de-DE')}`);
  lines.push(`Gesamtzahl Fälle:;${analytics.totalCases}`);
  lines.push(`Abgeschlossene Fälle:;${analytics.completedCasesCount} (${analytics.completionRate}%)`);
  lines.push(`Durchschnittliche Items pro Fall:;${analytics.averageItemsPerCase}`);
  lines.push(`Durchschnittsalter des Klientels:;${analytics.averageAge !== undefined ? `${analytics.averageAge} Jahre` : 'Keine Angabe'}`);
  lines.push('');

  lines.push('--- ALTERSVERTEILUNG DER KOHORTE ---');
  lines.push('Altersgruppe;Anzahl;Anteil (%)');
  analytics.ageDistribution.forEach((a) => {
    lines.push(`${a.label};${a.count};${a.percentage}%`);
  });
  lines.push('');

  lines.push('--- GESCHLECHTERVERTEILUNG ---');
  lines.push('Geschlecht;Anzahl;Anteil (%)');
  analytics.genderDistribution.forEach((g) => {
    lines.push(`${g.label};${g.count};${g.percentage}%`);
  });
  lines.push('');

  lines.push('--- SORGERECHTSVERHÄLTNISSE ---');
  lines.push('Sorgerecht;Anzahl;Anteil (%)');
  analytics.sorgerechtDistribution.forEach((s) => {
    lines.push(`${s.label};${s.count};${s.percentage}%`);
  });
  lines.push('');

  lines.push('--- ITEM-HÄUFIGKEITEN (ALLE KAPITEL) ---');
  lines.push('Code;Kapitel;Bereich;Bezeichnung;Häufigkeit;Prozentualer Anteil;Betroffene Chiffren;Detail-Optionen (Häufigkeiten)');
  analytics.allItems.forEach((item) => {
    const optionsDetail = item.optionsFrequencies && item.optionsFrequencies.length > 0
      ? item.optionsFrequencies.map((o) => `${o.option}: ${o.count} (${o.percentage}%)`).join(' | ')
      : '';
    lines.push(
      `"${item.code}";"${item.chapterTitle}";"${item.sectionTitle || ''}";"${item.label.replace(/"/g, '""')}";${item.totalOccurrences};${item.percentage}%;"${item.casesWithItem.join(', ')}";"${optionsDetail.replace(/"/g, '""')}"`
    );
  });
  lines.push('');

  lines.push('--- EINZELFALL-ÜBERSICHT ---');
  lines.push('Chiffre;Datum;Kostenträger;Geschlecht;Alter (Jahre);Letztes Kapitel;Erstellt;Zuletzt Geändert');
  cases.forEach((c) => {
    lines.push(
      `"${c.stammdaten.chiffre}";"${c.stammdaten.datum}";"${c.stammdaten.kostentraeger || ''}";"${c.stammdaten.geschlecht}";"${c.stammdaten.alterInJahren !== undefined ? c.stammdaten.alterInJahren : ''}";"${c.lastChapterId ?? 0}";"${c.createdAt || ''}";"${c.updatedAt || ''}"`
    );
  });

  return lines.join('\n');
}
