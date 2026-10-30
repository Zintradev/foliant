import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  FolderOpen,
  BookOpen,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { isTauriApp } from '../../utils/platform';
import { ChapterFormatting } from '../../utils/exportEpub';

export interface ExportSuccessInfo {
  destinationPath: string;
  bookTitle: string;
  author: string;
  scenesCount: number;
  chapterFormatting: ChapterFormatting;
  hasCover: boolean;
}

export interface ExportResultModalProps {
  data:
    | ({ type: 'success' } & ExportSuccessInfo)
    | { type: 'error'; message: string }
    | null;
  onClose: () => void;
}

export default function ExportResultModal({ data, onClose }: ExportResultModalProps) {
  const [copied, setCopied] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);

  if (!data) return null;

  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[ExportResultModal] Could not copy path:', err);
    }
  };

  const handleOpenFolder = async (path: string) => {
    if (!isTauriApp()) return;
    setOpeningFolder(true);
    try {
      await revealItemInDir(path);
    } catch (err) {
      console.warn('[ExportResultModal] Could not reveal item in directory:', err);
    } finally {
      setOpeningFolder(false);
    }
  };

  const getFormatLabel = (fmt: ChapterFormatting) => {
    switch (fmt) {
      case 'sub-folders':
        return 'Actos y Capítulos';
      case 'top-folders':
        return 'Capítulos Principales';
      case 'flatten':
        return 'Texto Continuo';
      default:
        return fmt;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-750/90 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 font-sans animate-in fade-in zoom-in-95 duration-150 relative text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          title="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        {data.type === 'success' ? (
          <>
            {/* Header */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="p-2.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 shadow-lg shadow-emerald-950/50 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                  ¡Exportación Exitosa!
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tu manuscrito digital ha sido empaquetado en formato EPUB estándar.
                </p>
              </div>
            </div>

            {/* Book Details Box */}
            <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100 truncate">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{data.bookTitle}</span>
                </div>
                <p className="text-xs text-zinc-400 italic pl-5.5 truncate">
                  por {data.author}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-750 text-zinc-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {data.scenesCount} escenas
                </span>

                <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-750 text-zinc-200 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-zinc-400" />
                  {getFormatLabel(data.chapterFormatting)}
                </span>

                {data.hasCover && (
                  <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-750 text-emerald-300 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    Con Portada
                  </span>
                )}
              </div>
            </div>

            {/* Destination Path Container */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Archivo Guardado En
              </span>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span
                  className="font-mono text-xs text-zinc-300 truncate flex-1 select-all"
                  title={data.destinationPath}
                >
                  {data.destinationPath}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyPath(data.destinationPath)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer shrink-0"
                  title="Copiar ruta al portapapeles"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              {isTauriApp() ? (
                <button
                  type="button"
                  onClick={() => handleOpenFolder(data.destinationPath)}
                  disabled={openingFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition cursor-pointer disabled:opacity-50"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mostrar en carpeta</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 rounded-lg text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 shadow-md transition cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Error Header */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="p-2.5 rounded-full bg-rose-950/80 border border-rose-600/60 text-rose-400 shadow-lg shadow-rose-950/50 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                  Error de Exportación
                </h3>
                <p className="text-xs text-rose-300 leading-relaxed">
                  No se pudo completar la generación del archivo EPUB.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-rose-900/40 text-xs text-rose-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
              {data.message}
            </div>

            {/* Error Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-750 text-zinc-200 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
