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
      className={`p-1.5 rounded-xs transition flex items-center justify-center cursor-pointer select-none text-current ${
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : isActive
          ? 'bg-black/15 dark:bg-zinc-800 text-current border border-current/30 shadow-xs'
          : 'opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-zinc-800/80 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

export default memo(ToolbarButton);
