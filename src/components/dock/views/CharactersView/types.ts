import {
  CharacterCustomField,
  CharacterTag,
  CharacterItem as DockCharacterItem,
} from '../../../../types/dock';
import { AppColorSettings } from '../../../../types/settings';

/**
 * Character item extended with an optional color key for the name label.
 * The value is a key of COLOR_SWATCHES (e.g. 'amber', 'sky'); undefined = no colored label.
 * NOTE: ideally add `nameColor?: string` directly to CharacterItem in types/dock.ts
 * and replace this intersection with a plain re-export.
 */
export type CharacterItem = DockCharacterItem & { nameColor?: string };

export interface CharactersViewProps {
  characters: CharacterItem[];
  onChange: (characters: CharacterItem[]) => void;
  isExpanded?: boolean;
  colorSettings?: AppColorSettings;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

export type { CharacterCustomField, CharacterTag };
