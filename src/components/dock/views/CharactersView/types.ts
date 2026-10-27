import { CharacterItem, CharacterCustomField, CharacterTag } from '../../../../types/dock';
import { AppColorSettings } from '../../../../types/settings';

export interface CharactersViewProps {
  characters: CharacterItem[];
  onChange: (characters: CharacterItem[]) => void;
  isExpanded?: boolean;
  colorSettings?: AppColorSettings;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

export type { CharacterItem, CharacterCustomField, CharacterTag };
