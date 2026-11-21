import { WorldItem, WorldCustomField } from '../../../../types/dock';
import { DropMode } from '../../../../types/settings';

export interface WorldbuildingViewProps {
  items: WorldItem[];
  onChange: (items: WorldItem[]) => void;
  worldDropMode?: DropMode;
  isExpanded?: boolean;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

export type { WorldItem, WorldCustomField };
