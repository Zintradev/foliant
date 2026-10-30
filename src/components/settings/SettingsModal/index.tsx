import React, { useState } from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';
import { SettingsSection, TaxonomySubTab, SettingsModalProps } from './types';
import { useSettingsDraft } from './useSettingsDraft';
import { SettingsSidebarNav } from './SettingsSidebarNav';
import { SettingsGeneralSection } from './SettingsGeneralSection';
import { SettingsAppearanceSection } from './SettingsAppearanceSection';
import { SettingsEditorSection } from './SettingsEditorSection';
import { SettingsTaxonomySection } from './SettingsTaxonomySection';
import { SettingsColorPickerPopup } from './SettingsColorPickerPopup';

export const SettingsModal = React.memo(function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [taxonomyTab, setTaxonomyTab] = useState<TaxonomySubTab>('roles');

  const currentLang = settings.preferences?.language || 'en';
  const { t } = useTranslation(currentLang);

  const {
    draftSettings,
    newCustomRoleName,
    setNewCustomRoleName,
    newCustomRoleColor,
    setNewCustomRoleColor,
    newCustomStorylineName,
    setNewCustomStorylineName,
    newCustomStorylineColor,
    setNewCustomStorylineColor,
    newCustomCategoryName,
    setNewCustomCategoryName,
    newCustomCategoryColor,
    setNewCustomCategoryColor,
    activeColorPicker,
    setActiveColorPicker,
    handlePreferenceChange,
    handleRoleColorChange,
    handleAddCustomRole,
    handleRemoveCustomRole,
    handleStorylineColorChange,
    handleAddCustomStoryline,
    handleRemoveCustomStoryline,
    handleCategoryColorChange,
    handleAddCustomCategory,
    handleRemoveCustomCategory,
    handleResetToDefault,
    applyPreset,
    customTheme,
    handleCustomColorChange,
    handleColorPickerHexChange,
  } = useSettingsDraft({
    isOpen,
    settings,
    onUpdateSettings,
    onClose,
    confirmResetMessage: t('resetDefaultsConfirm'),
  });

  if (!isOpen) return null;

  const prefs = draftSettings.preferences;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Studio Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[620px] max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
              <Sliders className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                {t('studioSettings')}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            title={t('closeSettings')}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Two-Column Body: Left Sidebar + Right Content */}
        <div className="flex-1 flex overflow-hidden">
          <SettingsSidebarNav
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            t={t}
          />

          {/* Right Content Panel */}
          <main className="flex-1 overflow-y-auto p-6 bg-zinc-950 space-y-6">
            {activeSection === 'general' && (
              <SettingsGeneralSection
                currentLang={prefs?.language || 'en'}
                saveMode={prefs?.saveMode || 'auto'}
                autoSaveInterval={prefs?.autoSaveInterval ?? 300}
                timelineDropMode={prefs?.timelineDropMode || 'shift'}
                worldDropMode={prefs?.worldDropMode || 'shift'}
                preserveManualSceneWidth={prefs?.preserveManualSceneWidth ?? false}
                preserveManualPlotHeight={prefs?.preserveManualPlotHeight ?? false}
                onPreferenceChange={handlePreferenceChange}
                t={t}
              />
            )}

            {activeSection === 'appearance' && (
              <SettingsAppearanceSection
                themeMode={prefs?.themeMode || 'dark'}
                customTheme={customTheme}
                onPreferenceChange={handlePreferenceChange}
                onCustomColorChange={handleCustomColorChange}
                onOpenColorPicker={setActiveColorPicker}
                t={t}
              />
            )}

            {activeSection === 'editor' && (
              <SettingsEditorSection
                editorIndentFirstLine={prefs?.editorIndentFirstLine ?? true}
                onPreferenceChange={handlePreferenceChange}
                t={t}
              />
            )}

            {activeSection === 'taxonomy' && (
              <SettingsTaxonomySection
                taxonomyTab={taxonomyTab}
                onTabChange={setTaxonomyTab}
                roles={draftSettings.roles}
                newRoleName={newCustomRoleName}
                onNewRoleNameChange={setNewCustomRoleName}
                newRoleColor={newCustomRoleColor}
                onNewRoleColorChange={setNewCustomRoleColor}
                onRoleColorChange={handleRoleColorChange}
                onAddRole={handleAddCustomRole}
                onRemoveRole={handleRemoveCustomRole}
                storylines={draftSettings.storylines}
                newStorylineName={newCustomStorylineName}
                onNewStorylineNameChange={setNewCustomStorylineName}
                newStorylineColor={newCustomStorylineColor}
                onNewStorylineColorChange={setNewCustomStorylineColor}
                onStorylineColorChange={handleStorylineColorChange}
                onAddStoryline={handleAddCustomStoryline}
                onRemoveStoryline={handleRemoveCustomStoryline}
                categories={draftSettings.categories}
                newCategoryName={newCustomCategoryName}
                onNewCategoryNameChange={setNewCustomCategoryName}
                newCategoryColor={newCustomCategoryColor}
                onNewCategoryColorChange={setNewCustomCategoryColor}
                onCategoryColorChange={handleCategoryColorChange}
                onAddCategory={handleAddCustomCategory}
                onRemoveCategory={handleRemoveCustomCategory}
                activePreset={prefs?.colorPreset}
                onApplyPreset={applyPreset}
                onOpenColorPicker={setActiveColorPicker}
                t={t}
              />
            )}
          </main>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetDefaults')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-xs transition cursor-pointer"
          >
            {t('done')}
          </button>
        </div>

        {/* Floating Custom RGB / HEX Color Picker Popover */}
        <SettingsColorPickerPopup
          activeColorPicker={activeColorPicker}
          onClose={() => setActiveColorPicker(null)}
          onChange={handleColorPickerHexChange}
          fallbackTitle={t('exactColor')}
        />
      </div>
    </div>
  );
});

export default SettingsModal;
