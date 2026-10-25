import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
  BookOpen,
  User,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  X,
  FileText,
  Loader2,
  Layers,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ListTree,
  HelpCircle,
  Languages,
  Smartphone,
  Building2,
} from 'lucide-react';
import { FoliantProject, TextNode } from '../../types/project';
import {
  resolveProjectAuthor,
  EpubExportOptions,
  ChapterFormatting,
  ExportProfile,
} from '../../utils/exportEpub';
import { useTranslation } from '../../i18n/translations';
import { countWords } from '../../utils/textMetrics';

export interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: FoliantProject;
  onExport: (options: EpubExportOptions) => Promise<void> | void;
  isExporting?: boolean;
}

interface TreeItem {
  node: TextNode;
  children: TreeItem[];
  depth: number;
}

/**
 * Native checkbox wrapper with support for HTML5 indeterminate visual state.
 */
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-emerald-500 transition shrink-0"
    />
  );
}

function ExportSettingsModalComponent({
  isOpen,
  onClose,
  project,
  onExport,
  isExporting = false,
}: ExportSettingsModalProps) {
  const { t } = useTranslation();

  // Tab State: 'metadata' | 'content'
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

  // Content Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const [chapterFormatting, setChapterFormatting] = useState<ChapterFormatting>('top-folders');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-fill Title, Author & select all nodes by default whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(project.title || 'Untitled Manuscript');
      setAuthor(resolveProjectAuthor(project) || 'Foliant Author');
      setPublisher('');
      setLanguage('es');
      setProfile('amazon');
      setIncludeVisualToc(true);
      setSelectedIds(new Set(project.chapters.map((c) => c.id)));
      setCollapsedFolderIds(new Set());
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

  // ---------------------------------------------------------------------------
  // Build Hierarchical Tree of Chapters & Fast Descendant Lookup
  // ---------------------------------------------------------------------------
  const { tree, allDescendantMap } = useMemo(() => {
    const nodeMap = new Map<string, TreeItem>();
    const roots: TreeItem[] = [];
    const chMap = new Map<string, string[]>();

    project.chapters.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        children: [],
        depth: 0,
      });
      chMap.set(node.id, []);
    });

    project.chapters.forEach((node) => {
      const item = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(item);
        chMap.get(node.parentId)!.push(node.id);
      } else {
        roots.push(item);
      }
    });

    const setDepth = (item: TreeItem, currentDepth: number) => {
      item.depth = currentDepth;
      item.children.forEach((c) => setDepth(c, currentDepth + 1));
    };
    roots.forEach((root) => setDepth(root, 0));

    // Compute all descendants map for fast toggle
    const descMap = new Map<string, string[]>();
    const computeDescendants = (id: string): string[] => {
      const children = chMap.get(id) || [];
      const res: string[] = [...children];
      for (const childId of children) {
        res.push(...computeDescendants(childId));
      }
      descMap.set(id, res);
      return res;
    };
    project.chapters.forEach((n) => computeDescendants(n.id));

    return { tree: roots, childrenMap: chMap, allDescendantMap: descMap };
  }, [project.chapters]);

  // ---------------------------------------------------------------------------
  // Tree Selection Logic
  // ---------------------------------------------------------------------------
  const handleToggleFolder = (folderId: string) => {
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleToggleNodeSelection = (node: TextNode) => {
    const isCurrentlySelected = selectedIds.has(node.id);
    const next = new Set(selectedIds);

    if (node.type === 'folder') {
      const descendants = allDescendantMap.get(node.id) || [];
      if (isCurrentlySelected) {
        // Deselect folder and all its descendants
        next.delete(node.id);
        descendants.forEach((id) => next.delete(id));
      } else {
        // Select folder and all its descendants
        next.add(node.id);
        descendants.forEach((id) => next.add(id));
      }
    } else {
      // Scene toggle
      if (isCurrentlySelected) {
        next.delete(node.id);
      } else {
        next.add(node.id);
        // Auto-select parent folders up to root
        let curr = project.chapters.find((c) => c.id === node.id);
        while (curr?.parentId) {
          next.add(curr.parentId);
          curr = project.chapters.find((c) => c.id === curr!.parentId);
        }
      }
    }

    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(project.chapters.map((c) => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleExpandAll = () => {
    if (collapsedFolderIds.size > 0) {
      setCollapsedFolderIds(new Set());
    } else {
      const allFolderIds = project.chapters
        .filter((c) => c.type === 'folder')
        .map((c) => c.id);
      setCollapsedFolderIds(new Set(allFolderIds));
    }
  };

  // Metrics
  const totalScenes = project.chapters.filter((c) => c.type === 'scene');
  const selectedScenes = totalScenes.filter((s) => selectedIds.has(s.id));
  const selectedWords = selectedScenes.reduce((acc, s) => acc + countWords(s.content), 0);

  // ---------------------------------------------------------------------------
  // Cover File Handlers
  // ---------------------------------------------------------------------------
  const handleProcessFile = (file: File) => {
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
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverBase64(null);
    setCoverFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExporting || selectedScenes.length === 0) return;

    await onExport({
      title: title.trim() || project.title || 'Untitled Manuscript',
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

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // Tree Item Node Renderer
  // ---------------------------------------------------------------------------
  const renderTreeItem = (item: TreeItem) => {
    const { node, children, depth } = item;
    const isFolder = node.type === 'folder';
    const isSelected = selectedIds.has(node.id);
    const isCollapsed = isFolder && collapsedFolderIds.has(node.id);

    // Compute indeterminate state for folders
    let isIndeterminate = false;
    if (isFolder) {
      const descendants = allDescendantMap.get(node.id) || [];
      const selectedDescendants = descendants.filter((id) => selectedIds.has(id));
      if (selectedDescendants.length > 0 && selectedDescendants.length < descendants.length) {
        isIndeterminate = true;
      } else if (selectedDescendants.length === 0 && isSelected) {
        isIndeterminate = true;
      }
    }

    const wordCount = !isFolder ? countWords(node.content) : 0;
    const childSceneCount = isFolder
      ? (allDescendantMap.get(node.id) || []).filter(
          (id) => project.chapters.find((c) => c.id === id)?.type === 'scene'
        ).length
      : 0;

    return (
      <div key={node.id} className="w-full">
        <div
          className={`group flex items-center justify-between py-1.5 px-2 rounded-md text-xs transition select-none hover:bg-zinc-850/80 ${
            isSelected ? 'text-zinc-100' : 'text-zinc-500'
          }`}
          style={{ paddingLeft: `${Math.max(depth * 18 + 8, 8)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Expand / Collapse for folders */}
            {isFolder ? (
              <button
                type="button"
                onClick={() => handleToggleFolder(node.id)}
                className="p-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
                title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            {/* Checkbox */}
            <IndeterminateCheckbox
              checked={isSelected}
              indeterminate={isIndeterminate}
              onChange={() => handleToggleNodeSelection(node)}
              disabled={isExporting}
            />

            {/* Icon */}
            {isFolder ? (
              isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )
            ) : (
              <FileText className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
            )}

            {/* Node Title */}
            <span
              onClick={() => handleToggleNodeSelection(node)}
              className={`truncate cursor-pointer ${
                isFolder ? 'font-semibold text-zinc-200' : 'font-normal'
              }`}
            >
              {node.title || (isFolder ? 'Untitled Folder' : 'Untitled Scene')}
            </span>
          </div>

          {/* Badges / Metrics */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isFolder ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-zinc-850 text-zinc-400 border border-zinc-750">
                {childSceneCount} scene{childSceneCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-400">
                {wordCount.toLocaleString()} w
              </span>
            )}
          </div>
        </div>

        {/* Nested Children */}
        {isFolder && !isCollapsed && children.length > 0 && (
          <div className="w-full">{children.map((child) => renderTreeItem(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={isExporting ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Export to EPUB
              </h2>
              <p className="text-xs text-zinc-400">
                Configure book metadata, selective contents, and chapter nesting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
            title={t('close') || 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
            {/* TAB 1: METADATA & COVER */}
            {activeTab === 'metadata' && (
              <div className="space-y-5 animate-in fade-in duration-100">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Book Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Chronicles of Foliant"
                      disabled={isExporting}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      Author Name
                    </label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      disabled={isExporting}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        Editorial o Año (Publisher / Year)
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500">
                        {t('optional')}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="e.g. Acme Publishing · 2026"
                      disabled={isExporting}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Languages className="w-3.5 h-3.5 text-emerald-400" />
                      Book Language (Idioma)
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={isExporting}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="es">Español (es)</option>
                      <option value="en">English (en)</option>
                      <option value="fr">Français (fr)</option>
                      <option value="de">Deutsch (de)</option>
                      <option value="it">Italiano (it)</option>
                      <option value="pt">Português (pt)</option>
                      <option value="ca">Català (ca)</option>
                      <option value="gl">Galego (gl)</option>
                      <option value="eu">Euskara (eu)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Enables native dictionary hyphenation (separación silábica) on Kindle and e-readers.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      Destino de Lectura
                    </label>
                    <select
                      value={profile}
                      onChange={(e) => setProfile(e.target.value as ExportProfile)}
                      disabled={isExporting}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="standard">EPUB Estándar (Apple Books, Kobo, Thorium)</option>
                      <option value="amazon">Ecosistema Amazon (Kindle, Calibre a AZW3)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {profile === 'amazon'
                        ? 'Purga line-height y márgenes verticales en <p> y aplica sanitización agresiva de saltos para evitar huecos en Kindle.'
                        : 'Mantiene el espaciado y ritmo vertical estándar de EPUB (line-height 1.4, margin-bottom 0.5em, widows/orphans 2).'}
                    </p>
                  </div>

                  {/* Visual Table of Contents Toggle */}
                  <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-750/80">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeVisualToc}
                        onChange={(e) => setIncludeVisualToc(e.target.checked)}
                        disabled={isExporting}
                        className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-emerald-500 transition shrink-0"
                      />
                      <div className="space-y-1">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                          <ListTree className="w-3.5 h-3.5 text-emerald-400" />
                          Incluir página de Índice visual
                        </span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Genera una página visual de tabla de contenidos (<code className="text-zinc-300">toc.xhtml</code>) al inicio del libro. Si se desmarca, se omite esta página en la lectura, manteniendo intactos los archivos de navegación del sistema (<code className="text-zinc-300">toc.ncx</code> y <code className="text-zinc-300">nav.xhtml</code>) para los menús de navegación nativos del e-reader.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Cover Image Upload Area */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Cover Image (Portada)
                    </span>
                    <span className="text-[11px] font-normal text-zinc-500">
                      {t('optional')}
                    </span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={isExporting}
                  />

                  {coverBase64 ? (
                    <div className="relative flex items-center gap-4 p-3.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 group">
                      <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden bg-black/60 border border-zinc-700 shadow-md flex items-center justify-center">
                        <img
                          src={coverBase64}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 rounded-sm">
                            Cover Ready
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {coverFileName || 'cover-image.jpg'}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Will be generated as the first page (cover.xhtml) and declared in the OPF manifest.
                        </p>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExporting}
                            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                          >
                            Change image
                          </button>
                          <span className="text-zinc-600">•</span>
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            disabled={isExporting}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isExporting && fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleProcessFile(file);
                      }}
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition select-none ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="p-3 rounded-full bg-zinc-850/80 border border-zinc-750 mb-2">
                        <UploadCloud className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-xs font-medium text-zinc-200 text-center">
                        Click or drag and drop your book cover here
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 text-center">
                        Supports JPEG, PNG, WEBP (Recommended: 1600 × 2560 px)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CONTENT SELECTION & CHAPTER FORMATTING */}
            {activeTab === 'content' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* 1. Chapter Formatting Selector */}
                <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      Chapter Formatting
                    </label>
                    <span className="text-[11px] text-zinc-500">Structural Nesting</span>
                  </div>

                  <select
                    value={chapterFormatting}
                    onChange={(e) => setChapterFormatting(e.target.value as ChapterFormatting)}
                    disabled={isExporting}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs font-medium text-zinc-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                  >
                    <option value="top-folders">
                      Treat top Folders as Chapters (Ignore subfolders, bundle scenes)
                    </option>
                    <option value="sub-folders">
                      Treat sub-folders as Chapters (Root folders act as Parts, subfolders as Chapters)
                    </option>
                    <option value="flatten">
                      Flatten all (Sequential scenes separated by asterisks, no folder index)
                    </option>
                  </select>

                  <p className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/60 p-2.5 rounded-md border border-zinc-850 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {chapterFormatting === 'top-folders' &&
                        'Each top-level folder becomes an individual book chapter with its own page-break and TOC entry. Subfolders are transparently bundled together with scene dividers.'}
                      {chapterFormatting === 'sub-folders' &&
                        'Root folders generate major book Part/Act dividers. Child subfolders generate individual Chapters with nested table of contents entries on e-readers.'}
                      {chapterFormatting === 'flatten' &&
                        'Exports only the selected scenes in chronological order into a unified narrative flow, separated by asterisks ( * * * ). Folder TOC entries are omitted.'}
                    </span>
                  </p>
                </div>

                {/* 2. Manuscript Tree View Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Manuscript Content Tree
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={isExporting}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-zinc-600">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={isExporting}
                        className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        Deselect All
                      </button>
                      <span className="text-zinc-600">•</span>
                      <button
                        type="button"
                        onClick={handleToggleExpandAll}
                        disabled={isExporting}
                        className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:underline cursor-pointer"
                      >
                        {collapsedFolderIds.size > 0 ? 'Expand All' : 'Collapse All'}
                      </button>
                    </div>
                  </div>

                  {/* Tree Container */}
                  <div className="border border-zinc-800 rounded-lg p-2 bg-zinc-900/40 max-h-[280px] overflow-y-auto space-y-0.5">
                    {tree.length > 0 ? (
                      tree.map((item) => renderTreeItem(item))
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-6">
                        No chapters or scenes found in this project.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>
                <strong>{selectedScenes.length}</strong> of{' '}
                <strong>{totalScenes.length}</strong> scenes selected (
                {selectedWords.toLocaleString()} words)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                {t('cancel') || 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isExporting || selectedScenes.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  selectedScenes.length === 0
                    ? 'Please select at least one scene to export'
                    : undefined
                }
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting EPUB...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Export EPUB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(ExportSettingsModalComponent);
