import { TextNode } from '../types/project';

/**
 * Recursively resolves all descendant chapter IDs for a given parent chapter ID.
 *
 * @param chapters Flat list of all project text nodes.
 * @param parentId The parent ID whose children and nested descendants should be discovered.
 * @returns Array of descendant chapter IDs.
 */
export function getDescendantChapterIds(
  chapters: readonly TextNode[],
  parentId: string
): string[] {
  const children = chapters.filter((c) => c.parentId === parentId);
  return children.flatMap((c) => [c.id, ...getDescendantChapterIds(chapters, c.id)]);
}
