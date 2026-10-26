import React from 'react';
import { DarkColorPicker } from '../../common/DarkColorPicker';
import { ActiveColorPickerState } from './types';

interface SettingsColorPickerPopupProps {
  activeColorPicker: ActiveColorPickerState | null;
  onClose: () => void;
  onChange: (hex: string) => void;
  fallbackTitle: string;
}

export const SettingsColorPickerPopup = React.memo(function SettingsColorPickerPopup({
  activeColorPicker,
  onClose,
  onChange,
  fallbackTitle,
}: SettingsColorPickerPopupProps) {
  if (!activeColorPicker) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="relative z-[61] shadow-2xl">
        <DarkColorPicker
          standalone
          color={activeColorPicker.color}
          title={activeColorPicker.title || fallbackTitle}
          onChange={onChange}
          onClose={onClose}
        />
      </div>
    </div>
  );
});
