import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { BookOpen, ListTree } from 'lucide-react';
import { resolveProjectAuthor, ExportProfile } from '../../../utils/exportEpub';
import { ExportSettingsModalProps, TreeItem } from './types';
import { useExportContentTree } from './useExportContentTree';
import ExportModalHeader from './ExportModalHeader';
import ExportModalFooter from './ExportModalFooter';
import ExportMetadataTab from './ExportMetadataTab';
import ExportContentTab from './ExportContentTab';
import ExportContentTreeItem from './ExportContentTreeItem';

function ExportSettingsModalComponent({
  isOpen,
  onClose,
  project,
  onExport,
  isExporting = false,
}: ExportSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'metadata' | 'content'>('metadata');

  // Metadata State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [language, setLanguage] = useState('es');
  const [profile, setProfile] = useState<ExportProfile>('amazon');
  const [includeVisualToc, setIncludeVisualToc] = useState(true);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    tree,
    allDescendantMap,
    selectedIds,
    collapsedFolderIds,
    chapterFormatting,
    setChapterFormatting,
    handleToggleFolder,
    handleToggleNodeSelection,
    handleSelectAll,
    handleDeselectAll,
    handleToggleExpandAll,
    totalScenes,
    selectedScenes,
    selectedWords,
  } = useExportContentTree({ project, isOpen });

  // Pre-fill Title & Author whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(project.title || 'Untitled Project');
      setAuthor(resolveProjectAuthor(project) || 'Foliant Author');
      setPublisher('');
      setLanguage('es');
      setProfile('amazon');
      setIncludeVisualToc(true);
      setActiveTab('metadata');
    }
  }, [isOpen, project]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  const handleProcessFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCoverBase64(result);
        setCoverFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  }, [handleProcessFile]);

  const handleRemoveCover = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverBase64(null);
    setCoverFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExporting || selectedScenes.length === 0) return;

    await onExport({
      title: title.trim() || project.title || 'Untitled Project',
      author: author.trim() || 'Foliant Author',
      publisher: publisher.trim() || undefined,
      language: language.trim() || 'es',
      profile,
      coverBase64,
      selectedIds: Array.from(selectedIds),
      chapterFormatting,
      includeVisualToc,
    });
  };

  const renderTreeItem = useCallback((item: TreeItem) => (
    <ExportContentTreeItem
      key={item.node.id}
      item={item}
      selectedIds={selectedIds}
      collapsedFolderIds={collapsedFolderIds}
      allDescendantMap={allDescendantMap}
      allChapters={project.chapters}
      isExporting={isExporting}
      onToggleFolder={handleToggleFolder}
      onToggleNodeSelection={handleToggleNodeSelection}
    />
  ), [
    selectedIds,
    collapsedFolderIds,
    allDescendantMap,
    project.chapters,
    isExporting,
    handleToggleFolder,
    handleToggleNodeSelection,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={isExporting ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <ExportModalHeader onClose={onClose} isExporting={isExporting} />

        {/* Tab Switcher Navigation */}
        <div className="flex items-center px-6 border-b border-zinc-800 bg-zinc-900/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Metadata & Cover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition cursor-pointer ${
              activeTab === 'content'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListTree className="w-4 h-4" />
            <span>Content Selection</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
              {selectedScenes.length} / {totalScenes.length}
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[62vh] flex-1">
            {activeTab === 'metadata' && (
              <ExportMetadataTab
                title={title}
                author={author}
                publisher={publisher}
                language={language}
                profile={profile}
                includeVisualToc={includeVisualToc}
                coverBase64={coverBase64}
                coverFileName={coverFileName}
                isDragging={isDragging}
                isExporting={isExporting}
                fileInputRef={fileInputRef}
                onTitleChange={setTitle}
                onAuthorChange={setAuthor}
                onPublisherChange={setPublisher}
                onLanguageChange={setLanguage}
                onProfileChange={setProfile}
                onIncludeVisualTocChange={setIncludeVisualToc}
                onFileInputChange={handleFileInputChange}
                onDropFile={handleProcessFile}
                onRemoveCover={handleRemoveCover}
                setIsDragging={setIsDragging}
              />
            )}

            {activeTab === 'content' && (
              <ExportContentTab
                chapterFormatting={chapterFormatting}
                onChapterFormattingChange={setChapterFormatting}
                isExporting={isExporting}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onToggleExpandAll={handleToggleExpandAll}
                collapsedFolderIds={collapsedFolderIds}
                tree={tree}
                renderTreeItem={renderTreeItem}
              />
            )}
          </div>

          <ExportModalFooter
            onClose={onClose}
            isExporting={isExporting}
            selectedScenesCount={selectedScenes.length}
            totalScenesCount={totalScenes.length}
            selectedWords={selectedWords}
          />
        </form>
      </div>
    </div>
  );
}

export default memo(ExportSettingsModalComponent);
