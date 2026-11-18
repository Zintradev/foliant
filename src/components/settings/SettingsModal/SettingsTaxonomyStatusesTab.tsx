import React from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { ColorThemeKey, COLOR_SWATCHES } from '../../../types/settings';
import { ActiveColorPickerState } from './types';
import { resolveColorHex, getColorLabel, getStatusLabel } from './constants';
import { getStatusBadgeProps } from '../../dock/views/ProjectStatsView';

interface SettingsTaxonomyStatusesTabProps {
  statuses: Record<string, string>;
  customStatuses: string[];
  newStatusName: string;
  onNewStatusNameChange: (val: string) => void;
  newStatusColor: string;
  onNewStatusColorChange: (val: string) => void;
  onStatusColorChange: (status: string, color: string) => void;
  onAddStatus: (e: React.FormEvent) => void;
  onRemoveStatus: (status: string) => void;
  editingStatusOriginalName: string | null;
  editingStatusDraftName: string;
  onEditingStatusDraftNameChange: (val: string) => void;
  onStartEditStatus: (status: string) => void;
  onCancelEditStatus: () => void;
  onSaveEditStatus: (originalName: string) => void;
  onOpenColorPicker: (state: ActiveColorPickerState) => void;
  t: (key: string, fallback?: string) => string;
}

const colorKeys = Object.keys(COLOR_SWATCHES) as ColorThemeKey[];

const DEFAULT_STATUS_KEYS = [
  'Not Started',
  'In Progress',
  'First Draft',
  'Revised',
  'Completed',
];

export const SettingsTaxonomyStatusesTab = React.memo(function SettingsTaxonomyStatusesTab({
  statuses,
  customStatuses,
  newStatusName,
  onNewStatusNameChange,
  newStatusColor,
  onNewStatusColorChange,
  onStatusColorChange,
  onAddStatus,
  onRemoveStatus,
  editingStatusOriginalName,
  editingStatusDraftName,
  onEditingStatusDraftNameChange,
  onStartEditStatus,
  onCancelEditStatus,
  onSaveEditStatus,
  onOpenColorPicker,
  t,
}: SettingsTaxonomyStatusesTabProps) {
  // Combine all statuses for display: default ones first, followed by custom statuses
  const allStatusKeys = [
    ...DEFAULT_STATUS_KEYS,
    ...customStatuses.filter((s) => !DEFAULT_STATUS_KEYS.includes(s)),
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="space-y-2">
          {allStatusKeys.map((statusKey) => {
            const isCustom = !DEFAULT_STATUS_KEYS.includes(statusKey);
            const color = statuses[statusKey] || (isCustom ? 'blue' : 'zinc');
            const hex = resolveColorHex(color);
            const isEditing = editingStatusOriginalName === statusKey;
            const badge = getStatusBadgeProps(statusKey, { statuses } as any);

            return (
              <div
                key={statusKey}
                className="flex items-center justify-between p-2.5 rounded-md bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                      <input
                        type="text"
                        value={editingStatusDraftName}
                        onChange={(e) => onEditingStatusDraftNameChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onSaveEditStatus(statusKey);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            onCancelEditStatus();
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-0.5 text-xs bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-zinc-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveEditStatus(statusKey)}
                        title={t('saveStatusName', 'Save')}
                        className="p-1 rounded text-emerald-400 hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEditStatus}
                        title={t('cancel')}
                        className="p-1 rounded text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-xs border uppercase tracking-wider truncate shrink-0 ${badge.className}`}
                        style={badge.style}
                      >
                        {getStatusLabel(statusKey, t)}
                      </span>
                      {isCustom ? (
                        <>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-xs shrink-0">
                            {t('customBadge')}
                          </span>
                          <button
                            type="button"
                            onClick={() => onStartEditStatus(statusKey)}
                            title={t('editCustomStatus', 'Edit name')}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer shrink-0"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 text-zinc-500 rounded-xs shrink-0">
                          {t('defaultBadge', 'Default')}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={color.startsWith('#') ? 'custom' : color}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        onOpenColorPicker({
                          type: 'status',
                          key: statusKey,
                          color: hex,
                          title: `${getStatusLabel(statusKey, t)} - ${t('color')}`,
                        });
                      } else {
                        onStatusColorChange(statusKey, e.target.value);
                      }
                    }}
                    className="text-xs bg-zinc-950 border border-zinc-700 rounded-sm px-2 py-1 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
                  >
                    {colorKeys.map((c) => (
                      <option key={c} value={c}>
                        {getColorLabel(c, t)}
                      </option>
                    ))}
                    <option value="custom">
                      {color.startsWith('#') ? color : t('customColor')}
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenColorPicker({
                        type: 'status',
                        key: statusKey,
                        color: hex,
                        title: `${getStatusLabel(statusKey, t)} - ${t('color')}`,
                      })
                    }
                    title={t('chooseColor')}
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0 cursor-pointer shadow-xs hover:scale-115 transition"
                    style={{ backgroundColor: hex }}
                  />

                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => onRemoveStatus(statusKey)}
                      title={t('deleteCustomStatus', 'Delete status')}
                      className="p-1 rounded-sm text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Status Form */}
        <form
          onSubmit={onAddStatus}
          className="pt-3 border-t border-zinc-800/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => onNewStatusNameChange(e.target.value)}
            placeholder={t('statusNamePlaceholder', 'Status name (e.g. Beta Review)...')}
            className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-hidden focus:border-zinc-600"
          />
          <select
            value={newStatusColor.startsWith('#') ? 'custom' : newStatusColor}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                onOpenColorPicker({
                  type: 'status',
                  key: '__new_status__',
                  color: resolveColorHex(newStatusColor),
                  title: t('addCustomStatus', 'Add Custom Status'),
                });
              } else {
                onNewStatusColorChange(e.target.value);
              }
            }}
            className="text-xs bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-zinc-200 capitalize cursor-pointer focus:outline-hidden"
          >
            {colorKeys.map((c) => (
              <option key={c} value={c}>
                {getColorLabel(c, t)}
              </option>
            ))}
            <option value="custom">
              {newStatusColor.startsWith('#') ? newStatusColor : t('customColor')}
            </option>
          </select>
          <button
            type="button"
            onClick={() =>
              onOpenColorPicker({
                type: 'status',
                key: '__new_status__',
                color: resolveColorHex(newStatusColor),
                title: t('addCustomStatus', 'Add Custom Status'),
              })
            }
            title={t('chooseColor')}
            className="w-4 h-4 rounded-full border border-black/30 shrink-0 cursor-pointer shadow-xs hover:scale-115 transition"
            style={{ backgroundColor: resolveColorHex(newStatusColor) }}
          />
          <button
            type="submit"
            disabled={!newStatusName.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('add')}</span>
          </button>
        </form>
      </div>
    </div>
  );
});
