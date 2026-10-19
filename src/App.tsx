import { useState } from 'react';
import {
  Feather,
  FolderPlus,
  FilePlus,
  Settings,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  BookMarked,
  Users,
  Compass,
} from 'lucide-react';
import { TextNode } from './types/project';
import FoliantEditor, { SaveStatus } from './components/editor/FoliantEditor';

export default function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [chapters, setChapters] = useState<TextNode[]>([
    {
      id: 'chapter-1',
      title: 'Chapter 1: The First Draft',
      content:
        'The old typewriter sat silently on the mahogany desk, its ink ribbon waiting for words that had yet to exist.',
      synopsis: 'Introduction to the protagonist and their struggle to begin writing.',
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: The Gathering',
      content:
        'Lanterns flickered along the stone corridor as the conspirators arrived one by one, cloaked against the autumn chill.',
      synopsis: 'The secret midnight meeting where the conspiracy begins.',
    },
  ]);

  const [activeChapterId, setActiveChapterId] = useState<string>('chapter-1');

  const activeChapter = chapters.find((chapter) => chapter.id === activeChapterId) ?? chapters[0];

  const handleContentChange = (newContent: string) => {
    setChapters((prevChapters) =>
      prevChapters.map((chapter) =>
        chapter.id === activeChapterId
          ? { ...chapter, content: newContent }
          : chapter
      )
    );
  };

  const wordCount = activeChapter?.content.trim()
    ? activeChapter.content.trim().split(/\s+/).length
    : 0;

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>Saving...</span>
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Saved</span>
          </span>
        );
      case 'unsaved':
        return (
          <span className="flex items-center gap-1.5 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            <span>Unsaved</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="flex items-center gap-1.5 text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-neutral-600" />
            <span>Idle</span>
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-900 text-neutral-200 select-none">
      {/* 1. LEFT PANEL: Foliant Structure (Binder / Tree) */}
      {leftOpen && (
        <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col transition-all duration-200">
          {/* Left panel header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800">
            <div className="flex items-center gap-2 font-medium text-sm text-neutral-100">
              <Feather className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold tracking-wide">Foliant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="New Chapter"
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
              >
                <FilePlus className="w-4 h-4" />
              </button>
              <button
                title="New Folder"
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Manuscript navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            <div className="px-2 py-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Outline
            </div>

            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                onClick={() => setActiveChapterId(chapter.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition ${
                  activeChapterId === chapter.id
                    ? 'bg-neutral-800 text-emerald-400 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <span>{chapter.title}</span>
              </div>
            ))}
          </nav>

          {/* Panel footer with Foliant version */}
          <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex justify-between items-center">
            <span>Foliant Alpha</span>
            <Settings className="w-4 h-4 cursor-pointer hover:text-neutral-300" />
          </div>
        </aside>
      )}

      {/* 2. CENTRAL PANEL: Writing Canvas */}
      <main className="flex-1 flex flex-col bg-neutral-900 min-w-0">
        {/* Top toolbar and statistics */}
        <header className="h-10 border-b border-neutral-800 flex items-center justify-between px-3 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              title="Toggle Outline"
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
            >
              {leftOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>
            <span className="text-xs font-medium text-neutral-400 truncate max-w-xs">
              {activeChapter?.title ?? 'No chapter selected'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-400">
            {/* Visual save status indicator */}
            {renderSaveStatus()}

            <span>
              Words: <strong className="text-neutral-200">{wordCount}</strong>
            </span>
            <span>
              Target: <strong className="text-neutral-200">80,000</strong>
            </span>
            <button
              onClick={() => setRightOpen(!rightOpen)}
              title="Toggle Context Panel"
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
            >
              {rightOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-8 py-10 flex justify-center">
          <div className="w-full max-w-2xl bg-neutral-900 focus:outline-none">
            <h1 className="text-3xl font-serif font-bold text-neutral-100 mb-6 pb-2 border-b border-neutral-800">
              {activeChapter?.title ?? 'Untitled'}
            </h1>
            <FoliantEditor
              content={activeChapter?.content ?? ''}
              onChange={handleContentChange}
              onStatusChange={setSaveStatus}
            />
          </div>
        </div>
      </main>

      {/* 3. RIGHT PANEL: Metadata and narrative context */}
      {rightOpen && (
        <aside className="w-72 border-l border-neutral-800 bg-neutral-950 p-4 flex flex-col gap-4 text-xs">
          <div className="flex items-center gap-2 font-medium text-neutral-200 pb-2 border-b border-neutral-800">
            <BookMarked className="w-4 h-4 text-emerald-400" />
            <span>Synopsis & Notes</span>
          </div>

          <textarea
            placeholder="Chapter synopsis or notes..."
            className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded p-2 text-neutral-300 resize-none focus:outline-none focus:border-neutral-600 font-sans"
            defaultValue=""
          />

          <div className="flex items-center gap-2 font-medium text-neutral-200 pt-2 border-t border-neutral-800">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Characters</span>
          </div>

          <div className="text-neutral-500 italic text-[11px]">
            No characters linked to this scene yet.
          </div>

          <div className="flex items-center gap-2 font-medium text-neutral-200 pt-2 border-t border-neutral-800">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Plot Threads</span>
          </div>

          <div className="text-neutral-500 italic text-[11px]">
            No plot arcs assigned.
          </div>
        </aside>
      )}
    </div>
  );
}