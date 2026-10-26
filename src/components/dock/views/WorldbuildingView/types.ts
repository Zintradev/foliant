import { WorldItem, WorldCustomField } from '../../../../types/dock';

export interface WorldbuildingViewProps {
  items: WorldItem[];
  onChange: (items: WorldItem[]) => void;
  worldDropMode?: 'shift' | 'swap';
  isExpanded?: boolean;
  saveMode?: 'auto' | 'manual';
  onDirtyChange?: (isDirty: boolean) => void;
}

export type { WorldItem, WorldCustomField };
