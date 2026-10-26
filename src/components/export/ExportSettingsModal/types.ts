import { FoliantProject, TextNode } from '../../../types/project';
import { EpubExportOptions } from '../../../utils/exportEpub';

export interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FoliantProject;
  onExport: (options: EpubExportOptions) => Promise<void> | void;
  isExporting?: boolean;
}

export interface TreeItem {
  node: TextNode;
  children: TreeItem[];
  depth: number;
}
