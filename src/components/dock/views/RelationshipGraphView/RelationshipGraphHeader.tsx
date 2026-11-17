import { memo } from 'react';
import {
  Network,
  Plus,
  RotateCcw,
  Undo2,
  Redo2,
  Link,
  X,
  MousePointer,
  BoxSelect,
  LassoSelect,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import { COLOR_PALETTE } from './constants';
import { SelectionTool } from './types';
import { useTranslation } from '../../../../i18n/translations';

interface RelationshipGraphHeaderProps {
  isExpanded: boolean;
  charactersCount: number;
  junctionsCount: number;
  relationshipsCount: number;
  connectingSourceName: string | null;
  filterType: string;
  selectionTool: SelectionTool;
  canUndo: boolean;
  canRedo: boolean;
  canConnect: boolean;
  canCopy: boolean;
  canPaste: boolean;
  selectedCount: number;
  onFilterChange: (type: string) => void;
  onToolChange: (tool: SelectionTool) => void;
  onCopy: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetLayout: () => void;
  onCancelConnecting: () => void;
  onOpenConnectModal: () => void;
  onHeaderClick: () => void;
}

function RelationshipGraphHeaderComponent({
  isExpanded,
  charactersCount,
  junctionsCount,
  relationshipsCount,
  connectingSourceName,
  filterType,
  selectionTool,
  canUndo,
  canRedo,
  canConnect,
  canCopy,
  canPaste,
  selectedCount,
  onFilterChange,
  onToolChange,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onResetLayout,
  onCancelConnecting,
  onOpenConnectModal,
  onHeaderClick,
}: RelationshipGraphHeaderProps) {
  const { t } = useTranslation();

  const getColorPaletteLabel = (key: string): string => {
    switch (key) {
      case 'blue': return t('relAlliance');
      case 'rose': return t('relHostile');
      case 'emerald': return t('relFamily');
      case 'amber': return t('relMentor');
      case 'purple': return t('relRomance');
      case 'cyan': return t('relContract');
      case 'zinc': return t('relNeutral');
      default: return key;
    }
  };

  return (
    <div
      onClick={onHeaderClick}
      className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0 z-20 gap-2 flex-wrap"
    >
      <div className="flex items-center gap-2">
        <Network className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
        {isExpanded && (
          <>
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              {t('relationshipBoard')}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ({charactersCount} {t('charactersCountLabel')} • {junctionsCount} {t('unionsCountLabel')} • {relationshipsCount} {t('linksCountLabel')})
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Quick instructions / connecting status */}
        {connectingSourceName ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-blue-950/80 border border-blue-800 text-blue-300 text-[10px] font-mono animate-pulse">
            <Link className="w-3 h-3" />
            <span>{t('clickTargetToConnect')} "{connectingSourceName}"</span>
            <button
              type="button"
              onClick={onCancelConnecting}
              className="ml-1 text-blue-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : null}

        {/* Selection Tools (Pointer, Box, Lasso) */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xs p-0.5 gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToolChange('pointer');
            }}
            title={t('selectionModePointer', 'Puntero / Navegación')}
            className={`p-1 rounded-xs transition cursor-pointer ${
              selectionTool === 'pointer'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <MousePointer className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToolChange('box');
            }}
            title={t('selectionModeBox', 'Selección en cuadrado')}
            className={`p-1 rounded-xs transition cursor-pointer ${
              selectionTool === 'box'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BoxSelect className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToolChange('lasso');
            }}
            title={t('selectionModeLasso', 'Selección a mano alzada')}
            className={`p-1 rounded-xs transition cursor-pointer ${
              selectionTool === 'lasso'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <LassoSelect className="w-3 h-3" />
          </button>
        </div>

        {/* Copy & Paste Tools */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xs p-0.5 gap-0.5">
          <button
            type="button"
            disabled={!canCopy}
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            title={`${t('copySelected', 'Copiar selección')} (Ctrl+C)`}
            className={`p-1 rounded-xs transition cursor-pointer ${
              canCopy
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'text-zinc-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={!canPaste}
            onClick={(e) => {
              e.stopPropagation();
              onPaste();
            }}
            title={`${t('pasteSelected', 'Pegar selección')} (Ctrl+V)`}
            className={`p-1 rounded-xs transition cursor-pointer ${
              canPaste
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'text-zinc-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <ClipboardPaste className="w-3 h-3" />
          </button>
        </div>

        {selectedCount > 0 && (
          <span className="text-[10px] font-mono text-blue-400 bg-blue-950/70 border border-blue-900 px-1.5 py-0.5 rounded-xs">
            {selectedCount} {t('selectedCount', 'seleccionados')}
          </span>
        )}

        {/* Filter Type */}
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xs px-1.5 py-0.5 text-zinc-300 text-[10px] font-mono focus:outline-none focus:border-zinc-600 cursor-pointer"
        >
          <option value="all">{t('allLinks')}</option>
          {Object.entries(COLOR_PALETTE).map(([key]) => (
            <option key={key} value={key}>
              {getColorPaletteLabel(key)}
            </option>
          ))}
        </select>

        {/* Undo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title={`${t('undo')} (Ctrl+Z)`}
          aria-label="Undo"
          className={`p-1 rounded-xs transition cursor-pointer ${
            canUndo
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              : 'text-zinc-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3 h-3" />
        </button>

        {/* Redo */}
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title={`${t('redo')} (Ctrl+Y / Ctrl+Shift+Z)`}
          aria-label="Redo"
          className={`p-1 rounded-xs transition cursor-pointer ${
            canRedo
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              : 'text-zinc-600 opacity-40 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-3 h-3" />
        </button>

        {/* Reset Layout */}
        <button
          type="button"
          onClick={onResetLayout}
          title={t('autoArrangeTooltip')}
          className="p-1 hover:bg-zinc-800 rounded-xs text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Connect Button (Modal trigger) */}
        {canConnect && (
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[10px] font-mono transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{t('connect')}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export const RelationshipGraphHeader = memo(RelationshipGraphHeaderComponent);
