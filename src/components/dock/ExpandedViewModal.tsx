import { useEffect } from 'react';
import { Minimize2, X, Maximize2 } from 'lucide-react';
import { TabId } from '../../types/dock';
import { TAB_META } from './DockContainer';

interface ExpandedViewModalProps {
  tabId: TabId | null;
  onClose: () => void;
  renderView: (tabId: TabId, isExpanded: boolean) => React.ReactNode;
}

export default function ExpandedViewModal({
  tabId,
  onClose,
  renderView,
}: ExpandedViewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!tabId) return null;

  const meta = TAB_META[tabId];
  const Icon = meta.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} Expanded Workspace`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 lg:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full h-full max-w-[1700px] max-h-[94vh] bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/60 select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Icon className="w-4 h-4 text-zinc-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {meta.label}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-zinc-900 text-zinc-400 border border-zinc-800">
                  <Maximize2 className="w-2.5 h-2.5 text-zinc-400" />
                  Expanded Workspace
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Spacious full-surface workspace maintaining modular panel state. Press ESC to return.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              title="Minimize back to panel (ESC)"
              className="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Minimize back to panel"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close (ESC)"
              className="p-1.5 rounded-sm hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Container - Spacious full-width surface without cramping */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 min-h-0">
          <div className="w-full h-full flex flex-col min-w-0">
            {renderView(tabId, true)}
          </div>
        </div>
      </div>
    </div>
  );
}
