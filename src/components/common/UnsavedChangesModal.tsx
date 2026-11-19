import { AlertTriangle, Save } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onSaveAndExit?: () => void;
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  saveAndExitText?: string;
}

/**
 * UnsavedChangesModal:
 * Navigation guard dialog shown when the user attempts to switch views or exit
 * with unsaved modifications pending in the active inspector, editor, or project.
 */
export default function UnsavedChangesModal({
  isOpen,
  onCancel,
  onConfirm,
  onSaveAndExit,
  title,
  message,
  cancelText,
  confirmText,
  saveAndExitText,
}: UnsavedChangesModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100">
              {title || t('unsavedChangesTitle')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {message || t('unsavedChangesMessage')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 md:py-1.5 rounded-sm text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer touch-manipulation min-h-[36px] md:min-h-0 flex items-center justify-center"
          >
            {cancelText || t('keepEditing')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-2 md:py-1.5 rounded-sm text-xs font-medium bg-rose-600/90 hover:bg-rose-600 text-white shadow-xs transition cursor-pointer touch-manipulation min-h-[36px] md:min-h-0 flex items-center justify-center"
          >
            {confirmText || t('discardAndExit')}
          </button>
          {onSaveAndExit && (
            <button
              type="button"
              onClick={onSaveAndExit}
              className="px-3.5 py-2 md:py-1.5 rounded-sm text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation min-h-[36px] md:min-h-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveAndExitText || t('saveAndExit')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
