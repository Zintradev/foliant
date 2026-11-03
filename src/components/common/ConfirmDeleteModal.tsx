import { Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n/translations';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  cancelText?: string;
  confirmText?: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  itemName,
  cancelText,
  confirmText,
  icon,
  iconBgClass,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || t('confirmDeleteTitle')}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onCancel}
    >
      <div
        className="bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 font-sans animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={iconBgClass || "p-2.5 rounded-full bg-rose-950/70 border border-rose-800/80 text-rose-400 shrink-0"}>
            {icon || <Trash2 className="w-5 h-5" />}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {title || t('confirmDeleteTitle')}
            </h3>
            {itemName && (
              <p className="text-xs font-medium text-zinc-300 truncate font-mono">
                "{itemName}"
              </p>
            )}
            <p className="text-xs text-zinc-400 leading-relaxed">
              {message || t('confirmDeleteDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
          >
            {cancelText || t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition cursor-pointer"
          >
            {confirmText || t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;