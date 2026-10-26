export interface ReferenceImage {
  id: string;
  path: string;
  src: string;
  name: string;
  sectionId: string;
  base64?: string;
}

export interface MoodboardSection {
  id: string;
  name: string;
}

export interface CachedReferenceImage {
  id?: string;
  path: string;
  src?: string;
  name?: string;
  sectionId?: string;
  base64?: string;
}

export interface MoodboardBlockProps {
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  isExpanded?: boolean;
}
