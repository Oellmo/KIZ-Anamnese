export interface AnamneseStammdaten {
  chiffre: string;
  datum: string;
  kostentraeger: string;
  geschlecht: 'männlich' | 'weiblich' | 'divers' | 'nicht angegeben' | string;
  alterInJahren?: number | string;
  geburtsdatum?: string;
  fachkraft?: string;
  einrichtung?: string;
}

export interface RechtlicherStatus {
  sorgerecht: string[]; // 'gemeinsam', 'mutter', 'vater', 'vormundschaft', 'einzelvormund'
  sorgerechtNotiz?: string;
  gesundheitsfuersorge: string[]; // 'sorgeberechtigte', 'teilentzug', 'vormund', 'anordnung'
  gesundheitsfuersorgeNotiz?: string;
}

export interface ItemEntry {
  selected: boolean;
  dauer?: string; // used in chapter 2
  beschreibung?: string; // used in chapters 3, 4, 5, 6, 7
  selectedOptions?: string[]; // multi-selected options from dropdown (e.g. 5.1.1, 6.1.1 - 6.1.5)
  tags?: string[]; // quick tags like 'akut', 'verdacht', 'gesichert', etc.
}

export interface KizFormData {
  id: string;
  ownerId?: string;
  updatedAt: string;
  createdAt: string;
  lastChapterId?: number; // stores last active chapter to resume where left off
  stammdaten: AnamneseStammdaten;
  rechtlicherStatus: RechtlicherStatus;
  
  // Chapter 2: Vorangegangene Hilfen (keyed by code like '2.1.1', '2.2.1', '2.3.1')
  vorangegangeneHilfen: Record<string, ItemEntry>;

  // Chapter 3: Schulsituation (keyed by code like '3.1.1')
  schulsituation: Record<string, ItemEntry>;
  schulsituationDetails?: {
    trend?: string;
    suspensions?: boolean;
    suspensionsNotiz?: string;
  };
  // Chapter 4: Psychosoziale Umstände & Umfeld (keyed by code like '4.1.1', '4.2.1', ...)
  psychosozial: Record<string, ItemEntry>;

  // Chapter 5: Entwicklungsstand & Neurodivergenz
  // 5.1 (keyed by '5.1.1' - '5.1.5'), 5.2 IQ selected code e.g. '5.2.3'
  entwicklungsstand: Record<string, ItemEntry>;
  iqSelectedCode?: string;
  iqNotiz?: string;

  // Chapter 6: Klinisch-Psychiatrische Symptomatik
  // 6.1, 6.2, 6.3, 6.4
  symptomatik: Record<string, ItemEntry>;

  // Chapter 7: Somatische, Neurologische & Organische Ursachen
  somatisch: Record<string, ItemEntry>;

  // Chapter 8: Ergänzungen & Evaluation
  ergaenzungen: {
    freitext: string;
    paedagogischeEinschaetzung: string;
    angebotsEvaluation: string;
    zielvereinbarung: string;
    naechsteSchritte: string;
    verantwortlich: string;
  };
}

export interface SectionDefinition {
  id: string;
  title: string;
  codePrefix?: string;
  description?: string;
  selectionType?: 'single' | 'multiple';
  items: ItemDefinition[];
  position?: number;
  deleted?: boolean;
}

export interface ItemDefinition {
  id?: string;
  code: string;
  label: string;
  description?: string;
  selectionType?: 'single' | 'multiple';
  hasDauer?: boolean;
  hasBeschreibung?: boolean;
  placeholder?: string;
  sublabel?: string;
  dropdownOptions?: string[];
  dropdownSelectionMode?: 'single' | 'multiple';
  inputType?: 'checkbox' | 'radio' | 'dropdown' | 'text' | 'optional-text';
  required?: boolean;
  position?: number;
  deleted?: boolean;
}

export interface ChapterDefinition {
  id: number;
  stableId?: string;
  position?: number;
  slug: string;
  title: string;
  shortTitle: string;
  badge: string;
  subtitle: string;
  sections?: SectionDefinition[];
  deleted?: boolean;
}

export interface CatalogItemDefinition extends ItemDefinition {
  id: string;
  code: string;
  position: number;
  inputType: 'checkbox' | 'radio' | 'dropdown' | 'text' | 'optional-text';
  required: boolean;
  deleted?: boolean;
}

export interface CatalogSectionDefinition extends Omit<SectionDefinition, 'items'> {
  stableId: string;
  code: string;
  position: number;
  deleted?: boolean;
  items: CatalogItemDefinition[];
}

export interface CatalogChapterDefinition extends Omit<ChapterDefinition, 'sections'> {
  stableId: string;
  code: string;
  position: number;
  deleted?: boolean;
  sections?: CatalogSectionDefinition[];
}

export interface QuestionnaireCatalog {
  schemaVersion: 1;
  version: number;
  updatedAt: string;
  updatedBy: string;
  chapters: CatalogChapterDefinition[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface AuthorizedAdmin {
  email: string;
  name: string;
  role: 'chef' | 'kollege' | 'admin';
  addedAt: string;
  addedBy?: string;
  notes?: string;
}

