import { useState, useCallback, memo } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';
import { useFlipAnimation } from '../../common/useFlipAnimation';
import { MoodboardBlockProps, MoodboardSection, ReferenceImage } from './types';
import { loadSettings } from '../../../types/settings';
import { useMoodboardStorage } from './useMoodboardStorage';
import { useMoodboardDragDrop } from './useMoodboardDragDrop';
import { MoodboardSectionFolder } from './MoodboardSectionFolder';
import { MoodboardLightbox } from './MoodboardLightbox';
import { MoodboardHeader } from './MoodboardHeader';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';

export function MoodboardBlockComponent({
  title,
  collapsible = true,
  defaultCollapsed = false,
  isExpanded = false,
  projectId,
  projectFilePath,
  initialVisuals,
  visualsDropMode = 'shift',
  onUpdateVisuals,
}: MoodboardBlockProps) {
  const { t } = useTranslation();
  const [activeSectionId, setActiveSectionId] = useState<string>('general');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeLightbox, setActiveLightbox] = useState<ReferenceImage | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [folderPendingDelete, setFolderPendingDelete] = useState<MoodboardSection | null>(null);
  const [imagePendingDelete, setImagePendingDelete] = useState<ReferenceImage | null>(null);

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
    handleDeleteSection,
  } = useMoodboardStorage(projectId, projectFilePath, onUpdateVisuals, initialVisuals);

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
  } = useMoodboardDragDrop({ images, commitImages, uploadFile, visualsDropMode });

  console.log(
    `[MoodboardBlock:RENDER] images=${images.length}, previewImages=${previewImages.length}, loading=${loading}, projectId="${projectId}", projectFilePath="${projectFilePath}"`
  );

  const registerCard = useFlipAnimation(Boolean(draggedImageId), draggedImageId);

  const getSectionLabel = useCallback(
    (sec?: MoodboardSection): string => {
      if (!sec) return '';
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
      console.log(`[MoodboardBlock] handleFilesSelected: ${files.length} file(s) into section "${targetSec}"`);
      for (const file of files) {
        console.log(`[MoodboardBlock] Uploading file: "${file.name}" to section "${targetSec}"`);
        await uploadFile(file, targetSec);
      }
    },
    [activeSectionId, uploadFile]
  );

  const onFolderDeleteRequest = useCallback((sec: MoodboardSection) => {
    const shouldConfirm = loadSettings()?.preferences?.confirmDelete?.visuals ?? true;
    if (!shouldConfirm) {
      handleDeleteSection(sec.id);
      return;
    }
    setFolderPendingDelete(sec);
  }, [handleDeleteSection]);

  const requestDeleteImage = useCallback((img: ReferenceImage) => {
    const shouldConfirm = loadSettings()?.preferences?.confirmDelete?.visuals ?? true;
    if (!shouldConfirm) {
      handleDeleteImage(img);
      if (activeLightbox?.id === img.id || activeLightbox?.path === img.path) {
        setActiveLightbox(null);
      }
      return;
    }
    setImagePendingDelete(img);
  }, [handleDeleteImage, activeLightbox]);

  const handleAddNewSection = useCallback(() => {
    handleAddSection(newSectionName);
    setNewSectionName('');
    setIsAddingSection(false);
  }, [handleAddSection, newSectionName]);

  const onSectionDragEnter = useCallback((e: React.DragEvent, secId: string) => {
    e.preventDefault();
    setDragOverSectionId(secId);
  }, [setDragOverSectionId]);

  const onSectionDragOver = useCallback((e: React.DragEvent, secId: string) => {
    e.preventDefault();
    setDragOverSectionId(secId);
  }, [setDragOverSectionId]);

  const onSectionDragLeave = useCallback((e: React.DragEvent, secId: string) => {
    e.preventDefault();
    setDragOverSectionId((prev) => (prev === secId ? null : prev));
  }, [setDragOverSectionId]);

  const activeSectionLabel = getSectionLabel(
    sections.find((s) => s.id === activeSectionId) || sections[0]
  );

  return (
    <>
      {activeLightbox && (
        <MoodboardLightbox
          image={activeLightbox}
          onClose={() => setActiveLightbox(null)}
          onDelete={(img) => requestDeleteImage(img)}
        />
      )}

      {imagePendingDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(imagePendingDelete)}
          title={t('deleteImage', 'Eliminar Imagen')}
          message={t(
            'deleteImageConfirm',
            '¿Estás seguro de que deseas eliminar esta imagen de referencia? Esta acción no se puede deshacer.'
          )}
          itemName={imagePendingDelete.name}
          onConfirm={() => {
            handleDeleteImage(imagePendingDelete);
            setImagePendingDelete(null);
            if (activeLightbox?.id === imagePendingDelete.id || activeLightbox?.path === imagePendingDelete.path) {
              setActiveLightbox(null);
            }
          }}
          onCancel={() => setImagePendingDelete(null)}
        />
      )}

      {folderPendingDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(folderPendingDelete)}
          title={t('deleteFolder', 'Eliminar Carpeta')}
          message={t(
            'confirmDeleteFolderVisuals',
            '¿Estás seguro de que deseas eliminar esta carpeta? Las imágenes contenidas dentro también serán eliminadas.'
          )}
          itemName={folderPendingDelete.name}
          onConfirm={() => {
            handleDeleteSection(folderPendingDelete.id);
            setFolderPendingDelete(null);
          }}
          onCancel={() => setFolderPendingDelete(null)}
        />
      )}

      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border rounded-md transition-colors overflow-hidden ${isCanvasDragging
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

            {loading && previewImages.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                <span className="text-xs font-mono">{t('loadingImages')}</span>
              </div>
            ) : previewImages.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2 border border-dashed border-zinc-800/80 rounded">
                <Sparkles className="w-6 h-6 text-zinc-600" />
                <span className="text-xs font-medium text-zinc-400">{t('emptyVisualsMessage')}</span>
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
                      onDeleteFolder={onFolderDeleteRequest}
                      onSelect={() => setActiveSectionId(section.id)}
                      onToggleCollapse={() => toggleSectionCollapse(section.id)}
                      onSectionDrop={handleSectionDrop}
                      onSectionDragEnter={onSectionDragEnter}
                      onSectionDragOver={onSectionDragOver}
                      onSectionDragLeave={onSectionDragLeave}
                      registerCard={registerCard}
                      onPreview={setActiveLightbox}
                      onDeleteImage={requestDeleteImage}
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
