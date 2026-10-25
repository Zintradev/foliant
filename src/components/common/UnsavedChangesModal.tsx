import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/translations';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * UnsavedChangesModal:
 * Navigation guard dialog shown when the user attempts to switch views or tabs
 * with unsaved modifications pending in the active inspector or editor.
 */
export default function UnsavedChangesModal({
  isOpen,
  onCancel,
  onConfirm,
}: UnsavedChangesModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100">
              {t('unsavedChangesTitle')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('unsavedChangesMessage')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
          >
            {t('keepEditing')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition cursor-pointer"
          >
            {t('discardAndSwitch')}
          </button>
        </div>
      </div>
    </div>
  );
}
