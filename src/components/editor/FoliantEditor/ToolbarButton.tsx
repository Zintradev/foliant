import React, { memo } from 'react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-xs transition flex items-center justify-center cursor-pointer select-none ${
        disabled
          ? 'opacity-30 cursor-not-allowed text-zinc-500'
          : isActive
          ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-xs'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/80 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

export default memo(ToolbarButton);
