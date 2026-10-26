import React from 'react';
import { TaxonomySubTab, ActiveColorPickerState, PresetType } from './types';
import { SettingsTaxonomyRolesTab } from './SettingsTaxonomyRolesTab';
import { SettingsTaxonomyStorylinesTab } from './SettingsTaxonomyStorylinesTab';
import { SettingsTaxonomyCategoriesTab } from './SettingsTaxonomyCategoriesTab';
import { SettingsTaxonomyPresetsTab } from './SettingsTaxonomyPresetsTab';

interface SettingsTaxonomySectionProps {
  taxonomyTab: TaxonomySubTab;
  onTabChange: (tab: TaxonomySubTab) => void;
  roles: Record<string, string>;
  newRoleName: string;
  onNewRoleNameChange: (val: string) => void;
  newRoleColor: string;
  onNewRoleColorChange: (val: string) => void;
  onRoleColorChange: (role: string, color: string) => void;
  onAddRole: (e: React.FormEvent) => void;
  onRemoveRole: (role: string) => void;
  storylines: Record<string, string>;
  newStorylineName: string;
  onNewStorylineNameChange: (val: string) => void;
  newStorylineColor: string;
  onNewStorylineColorChange: (val: string) => void;
  onStorylineColorChange: (key: string, color: string) => void;
  onAddStoryline: (e: React.FormEvent) => void;
  onRemoveStoryline: (key: string) => void;
  categories: Record<string, string>;
  newCategoryName: string;
  onNewCategoryNameChange: (val: string) => void;
  newCategoryColor: string;
  onNewCategoryColorChange: (val: string) => void;
  onCategoryColorChange: (category: string, color: string) => void;
  onAddCategory: (e: React.FormEvent) => void;
  onRemoveCategory: (key: string) => void;
  activePreset: string | undefined;
  onApplyPreset: (preset: PresetType) => void;
  onOpenColorPicker: (state: ActiveColorPickerState) => void;
  t: (key: string, fallback?: string) => string;
}

export const SettingsTaxonomySection = React.memo(function SettingsTaxonomySection({
  taxonomyTab,
  onTabChange,
  roles,
  newRoleName,
  onNewRoleNameChange,
  newRoleColor,
  onNewRoleColorChange,
  onRoleColorChange,
  onAddRole,
  onRemoveRole,
  storylines,
  newStorylineName,
  onNewStorylineNameChange,
  newStorylineColor,
  onNewStorylineColorChange,
  onStorylineColorChange,
  onAddStoryline,
  onRemoveStoryline,
  categories,
  newCategoryName,
  onNewCategoryNameChange,
  newCategoryColor,
  onNewCategoryColorChange,
  onCategoryColorChange,
  onAddCategory,
  onRemoveCategory,
  activePreset,
  onApplyPreset,
  onOpenColorPicker,
  t,
}: SettingsTaxonomySectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">{t('categoryTaxonomy')}</h3>
        </div>

        {/* Sub-Tabs switcher */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          <button
            onClick={() => onTabChange('roles')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              taxonomyTab === 'roles' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('characterRoles')}
          </button>
          <button
            onClick={() => onTabChange('storylines')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              taxonomyTab === 'storylines' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('storylineTags')}
          </button>
          <button
            onClick={() => onTabChange('categories')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              taxonomyTab === 'categories' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('worldLore')}
          </button>
          <button
            onClick={() => onTabChange('presets')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              taxonomyTab === 'presets' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t('presets')}
          </button>
        </div>
      </div>

      {taxonomyTab === 'roles' && (
        <SettingsTaxonomyRolesTab
          roles={roles}
          newRoleName={newRoleName}
          onNewRoleNameChange={onNewRoleNameChange}
          newRoleColor={newRoleColor}
          onNewRoleColorChange={onNewRoleColorChange}
          onRoleColorChange={onRoleColorChange}
          onAddRole={onAddRole}
          onRemoveRole={onRemoveRole}
          onOpenColorPicker={onOpenColorPicker}
          t={t}
        />
      )}

      {taxonomyTab === 'storylines' && (
        <SettingsTaxonomyStorylinesTab
          storylines={storylines}
          newStorylineName={newStorylineName}
          onNewStorylineNameChange={onNewStorylineNameChange}
          newStorylineColor={newStorylineColor}
          onNewStorylineColorChange={onNewStorylineColorChange}
          onStorylineColorChange={onStorylineColorChange}
          onAddStoryline={onAddStoryline}
          onRemoveStoryline={onRemoveStoryline}
          onOpenColorPicker={onOpenColorPicker}
          t={t}
        />
      )}

      {taxonomyTab === 'categories' && (
        <SettingsTaxonomyCategoriesTab
          categories={categories}
          newCategoryName={newCategoryName}
          onNewCategoryNameChange={onNewCategoryNameChange}
          newCategoryColor={newCategoryColor}
          onNewCategoryColorChange={onNewCategoryColorChange}
          onCategoryColorChange={onCategoryColorChange}
          onAddCategory={onAddCategory}
          onRemoveCategory={onRemoveCategory}
          onOpenColorPicker={onOpenColorPicker}
          t={t}
        />
      )}

      {taxonomyTab === 'presets' && (
        <SettingsTaxonomyPresetsTab
          activePreset={activePreset}
          onApplyPreset={onApplyPreset}
          t={t}
        />
      )}
    </div>
  );
});
