import { useState, useCallback, memo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';
import { useFlipAnimation } from '../../common/useFlipAnimation';
import { MoodboardBlockProps, MoodboardSection, ReferenceImage } from './types';
import { useMoodboardStorage } from './useMoodboardStorage';
import { useMoodboardDragDrop } from './useMoodboardDragDrop';
import { MoodboardSectionFolder } from './MoodboardSectionFolder';
import { MoodboardLightbox } from './MoodboardLightbox';
import { MoodboardHeader } from './MoodboardHeader';

export function MoodboardBlockComponent({
  title,
  collapsible = true,
  defaultCollapsed = false,
  isExpanded = false,
}: MoodboardBlockProps) {
  const { t } = useTranslation();
  const [activeSectionId, setActiveSectionId] = useState<string>('general');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeLightbox, setActiveLightbox] = useState<ReferenceImage | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const {
    images,
    commitImages,
    sections,
    loading,
    uploading,
    errorMessage,
    uploadFile,
    handleDeleteImage,
    handleAddSection,
  } = useMoodboardStorage();

  const {
    isCanvasDragging,
    draggedImageId,
    dragOverSectionId,
    setDragOverSectionId,
    dragOverImageId,
    dragOverPosition,
    previewImages,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleImageDragStart,
    handleImageDragEnter,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDropOnImage,
    handleImageDragEnd,
    handleSectionDrop,
  } = useMoodboardDragDrop({ images, commitImages, uploadFile });

  const registerCard = useFlipAnimation(Boolean(draggedImageId), draggedImageId);

  const getSectionLabel = useCallback(
    (sec: MoodboardSection): string => {
      if (sec.id === 'general') return t('sectionGeneral');
      if (sec.id === 'characters') return t('sectionCharacters');
      if (sec.id === 'locations') return t('sectionLocations');
      if (sec.id === 'atmosphere') return t('sectionAtmosphere');
      return sec.name;
    },
    [t]
  );

  const toggleSectionCollapse = useCallback((secId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  }, []);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const targetSec = activeSectionId || 'general';
      for (const file of files) {
        await uploadFile(file, targetSec);
      }
    },
    [activeSectionId, uploadFile]
  );

  const handleAddNewSection = useCallback(() => {
    handleAddSection(newSectionName);
    setNewSectionName('');
    setIsAddingSection(false);
  }, [handleAddSection, newSectionName]);

  const activeSectionLabel = getSectionLabel(
    sections.find((s) => s.id === activeSectionId) || sections[0]
  );

  return (
    <>
      {activeLightbox && (
        <MoodboardLightbox
          image={activeLightbox}
          onClose={() => setActiveLightbox(null)}
          onDelete={handleDeleteImage}
        />
      )}

      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border rounded-md transition-colors overflow-hidden ${
          isCanvasDragging
            ? 'border-emerald-500/80 bg-emerald-950/20 ring-1 ring-emerald-500/30'
            : 'border-zinc-800 bg-zinc-900/30'
        }`}
      >
        <MoodboardHeader
          title={title}
          imagesCount={images.length}
          collapsible={collapsible}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          isAddingSection={isAddingSection}
          onToggleAddSection={() => setIsAddingSection(!isAddingSection)}
          newSectionName={newSectionName}
          onNewSectionNameChange={setNewSectionName}
          onAddSection={handleAddNewSection}
          uploading={uploading}
          activeSectionLabel={activeSectionLabel}
          onFilesSelected={handleFilesSelected}
        />

        {!collapsed && (
          <div className="p-3 space-y-4">
            {errorMessage && (
              <div className="p-2 text-xs bg-red-950/40 border border-red-800/60 rounded text-red-300">
                {errorMessage}
              </div>
            )}

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                <span className="text-xs font-mono">{t('loadingImages')}</span>
              </div>
            ) : sections.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2 border border-dashed border-zinc-800/80 rounded">
                <Sparkles className="w-6 h-6 text-zinc-600" />
                <span className="text-xs">{t('noImagesYet')}</span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {t('dragDropOrAdd')}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => {
                  const sectionImages = previewImages.filter(
                    (img) => (img.sectionId || 'general') === section.id
                  );
                  return (
                    <MoodboardSectionFolder
                      key={section.id}
                      section={section}
                      sectionLabel={getSectionLabel(section)}
                      images={sectionImages}
                      isExpanded={isExpanded}
                      isActive={activeSectionId === section.id}
                      isCollapsed={Boolean(collapsedSections[section.id])}
                      isDragOver={dragOverSectionId === section.id}
                      draggedImageId={draggedImageId}
                      dragOverImageId={dragOverImageId}
                      dragOverPosition={dragOverPosition}
                      emptyMessage={t('noImagesInSection')}
                      onSelect={() => setActiveSectionId(section.id)}
                      onToggleCollapse={() => toggleSectionCollapse(section.id)}
                      onSectionDrop={handleSectionDrop}
                      onSectionDragEnter={(e, secId) => {
                        e.preventDefault();
                        setDragOverSectionId(secId);
                      }}
                      onSectionDragOver={(e, secId) => {
                        e.preventDefault();
                        setDragOverSectionId(secId);
                      }}
                      onSectionDragLeave={(e, secId) => {
                        e.preventDefault();
                        if (dragOverSectionId === secId) setDragOverSectionId(null);
                      }}
                      registerCard={registerCard}
                      onPreview={setActiveLightbox}
                      onDeleteImage={handleDeleteImage}
                      onImageDragStart={handleImageDragStart}
                      onImageDragEnter={handleImageDragEnter}
                      onImageDragOver={handleImageDragOver}
                      onImageDragLeave={handleImageDragLeave}
                      onImageDropOnImage={handleImageDropOnImage}
                      onImageDragEnd={handleImageDragEnd}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export const MoodboardBlock = memo(MoodboardBlockComponent);
export default MoodboardBlock;
