import React from 'react';
import { Coffee } from 'lucide-react';
import { isTauriApp } from '../../utils/platform';

export interface KofiButtonProps {
  className?: string;
  label?: string;
  title?: string;
  compact?: boolean;
}

export const KOFI_URL = 'https://ko-fi.com/zintradev';

export async function openKofiUrl(e?: React.MouseEvent): Promise<void> {
  if (e) {
    e.preventDefault();
  }
  if (isTauriApp()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(KOFI_URL);
      return;
    } catch {
      // Fallback to window.open if opener plugin throws
    }
  }
  window.open(KOFI_URL, '_blank', 'noopener,noreferrer');
}

export const KofiButton: React.FC<KofiButtonProps> = ({
  className = '',
  label = 'Apoyar en Ko-fi',
  title,
  compact = false,
}) => {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={openKofiUrl}
      title={title || undefined}
      className={`inline-flex flex-row items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors duration-150 group select-none whitespace-nowrap shrink-0 ${className}`}
    >
      <Coffee className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors shrink-0" />
      {!compact && <span className="whitespace-nowrap">{label}</span>}
    </a>
  );
};

export default KofiButton;
