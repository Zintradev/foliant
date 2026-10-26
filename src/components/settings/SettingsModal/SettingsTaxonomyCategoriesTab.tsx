import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ColorThemeKey, COLOR_SWATCHES } from '../../../types/settings';
import { ActiveColorPickerState } from './types';
import { resolveColorHex, getColorLabel, getCategoryLabel } from './constants';

interface SettingsTaxonomyCategoriesTabProps {
  categories: Record<string, string>;
  newCategoryName: string;
  onNewCategoryNameChange: (val: string) => void;
  newCategoryColor: string;
  onNewCategoryColorChange: (val: string) => void;
  onCategoryColorChange: (category: string, color: string) => void;
  onAddCategory: (e: React.FormEvent) => void;
  onRemoveCategory: (key: string) => void;
  onOpenColorPicker: (state: ActiveColorPickerState) => void;
  t: (key: string, fallback?: string) => string;
}

const colorKeys = Object.keys(COLOR_SWATCHES) as ColorThemeKey[];

export const SettingsTaxonomyCategoriesTab = React.memo(function SettingsTaxonomyCategoriesTab({
  categories,
  newCategoryName,
  onNewCategoryNameChange,
  newCategoryColor,
  onNewCategoryColorChange,
  onCategoryColorChange,
  onAddCategory,
  onRemoveCategory,
  onOpenColorPicker,
  t,
}: SettingsTaxonomyCategoriesTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="space-y-2">
          {Object.entries(categories).map(([category, color]) => {
            const isCustomCat = ![
              'Location',
              'Faction',
              'Lore',
              'Artifact',
            ].includes(category);
            const hex = resolveColorHex(color);

            return (
              <div
                key={category}
                className="flex items-center justify-between p-2.5 rounded-md bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200 capitalize">
                    {getCategoryLabel(category, t)}
                  </span>
                  {isCustomCat && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-xs">
                      {t('customBadge')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={color.startsWith('#') ? 'custom' : color}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        onOpenColorPicker({
                          type: 'category',
                          key: category,
                          color: hex,
                          title: `${getCategoryLabel(category, t)} - ${t('color')}`,
                        });
                      } else {
                        onCategoryColorChange(category, e.target.value);
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
                        type: 'category',
                        key: category,
                        color: hex,
                        title: `${getCategoryLabel(category, t)} - ${t('color')}`,
                      })
                    }
                    title={t('chooseColor')}
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0 cursor-pointer shadow-xs hover:scale-115 transition"
                    style={{ backgroundColor: hex }}
                  />

                  {isCustomCat && (
                    <button
                      onClick={() => onRemoveCategory(category)}
                      title={t('deleteCustomCategory')}
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

        {/* Add Custom Category Form */}
        <form
          onSubmit={onAddCategory}
          className="pt-3 border-t border-zinc-800/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder={t('categoryNamePlaceholder')}
            className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:outline-hidden focus:border-zinc-600"
          />
          <select
            value={
              newCategoryColor.startsWith('#')
                ? 'custom'
                : newCategoryColor
            }
            onChange={(e) => {
              if (e.target.value === 'custom') {
                onOpenColorPicker({
                  type: 'category',
                  key: '__new_category__',
                  color: resolveColorHex(newCategoryColor),
                  title: t('addCustomCategory'),
                });
              } else {
                onNewCategoryColorChange(e.target.value);
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
              {newCategoryColor.startsWith('#')
                ? newCategoryColor
                : t('customColor')}
            </option>
          </select>
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
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
