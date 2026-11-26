import { CatalogChapterDefinition, CatalogItemDefinition, CatalogSectionDefinition, ChapterDefinition, ItemDefinition, QuestionnaireCatalog } from '../types/anamnese';
import { CHAPTERS } from './kizFormStructure';

export type { CatalogChapterDefinition, CatalogItemDefinition, CatalogSectionDefinition, QuestionnaireCatalog } from '../types/anamnese';

export const CATALOG_DOCUMENT_ID = 'questionnaire_catalog';
export const CATALOG_VERSION_ID = 'questionnaire_catalog_versions';
export const LEGACY_CATALOG_VERSION = 'legacy-static-v1';

function stableIdForItem(chapterId: number, sectionId: string, item: ItemDefinition): string {
  const id = (item as CatalogItemDefinition).id || `item_${chapterId}_${sectionId}_${item.code ?? ''}`;
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function catalogFromChapters(chapters: ChapterDefinition[], version = 1, updatedBy = 'system'): QuestionnaireCatalog {
  return {
    schemaVersion: 1,
    version,
    updatedAt: new Date().toISOString(),
    updatedBy,
    chapters: chapters.filter((chapter) => chapter.id >= 1 && chapter.id <= 7).map((chapter, chapterIndex) => ({
        ...chapter,
        stableId: (chapter as CatalogChapterDefinition).stableId || `chapter_${chapter.slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        code: (chapter as CatalogChapterDefinition).code ?? String(chapter.id),
        position: (chapter as CatalogChapterDefinition).position ?? chapterIndex,
        sections: (chapter.sections ?? []).map((section, sectionIndex) => ({
          ...section,
          stableId: (section as CatalogSectionDefinition).stableId || `group_${chapter.slug}_${section.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          code: (section as CatalogSectionDefinition).code || section.id,
          position: (section as CatalogSectionDefinition).position ?? sectionIndex,
          items: section.items.map((item, itemIndex) => ({
            ...item,
            code: item.code ?? '',
            id: stableIdForItem(chapter.id, section.id, item),
            position: (item as CatalogItemDefinition).position ?? itemIndex,
            inputType: (item as CatalogItemDefinition).inputType || (item.dropdownOptions?.length ? 'dropdown' : item.hasBeschreibung ? 'optional-text' : item.selectionType === 'single' || section.selectionType === 'single' ? 'radio' : 'checkbox'),
            required: (item as CatalogItemDefinition).required ?? false,
          })),
        })),
      })),
  };
}

export const SEED_CATALOG: QuestionnaireCatalog = catalogFromChapters(CHAPTERS);

export function activeChapters(catalog: QuestionnaireCatalog): CatalogChapterDefinition[] {
  return catalog.chapters
    .filter((chapter) => !chapter.deleted)
    .map((chapter) => ({
      ...chapter,
      sections: chapter.sections?.filter((section) => !section.deleted).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.deleted).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      })),
    }))
    .sort((a, b) => (a.position ?? a.id) - (b.position ?? b.id));
}
