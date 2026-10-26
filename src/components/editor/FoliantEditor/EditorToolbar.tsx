import { useState, memo } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Quote,
  Minus,
  Omega,
} from 'lucide-react';
import { EditorFontFamily } from '../../../types/settings';
import ToolbarButton from './ToolbarButton';
import UnderlineColorPicker from './UnderlineColorPicker';
import HighlightColorPicker from './HighlightColorPicker';

interface EditorToolbarProps {
  editor: Editor | null;
  onOpenSymbols: () => void;
  currentFont: EditorFontFamily;
  onFontChange: (font: EditorFontFamily) => void;
}

function EditorToolbar({
  editor,
  onOpenSymbols,
  currentFont,
  onFontChange,
}: EditorToolbarProps) {
  const isEditorReady = !!editor && !editor.isDestroyed;

  const [underlineColor, setUnderlineColor] = useState('#ef4444');
  const [highlightColor, setHighlightColor] = useState('#fef08a');

  // Current font size at cursor
  const activeFontSize = (editor?.getAttributes('fontSize')?.size as string) || '16px';

  const handleFontSizeChange = (size: string) => {
    if (!editor || editor.isDestroyed) return;
    if (size === '16px') {
      editor.chain().focus().unsetMark('fontSize').run();
    } else {
      editor.chain().focus().setMark('fontSize', { size }).run();
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xs border-b border-zinc-800 pb-2 pt-0.5 mb-6 flex items-center flex-nowrap gap-1 select-none overflow-visible">
      {/* Font Family Quick Selector */}
      <div className="flex items-center shrink-0 mr-0.5">
        <select
          value={currentFont}
          onChange={(e) => onFontChange(e.target.value as EditorFontFamily)}
          className="h-6.5 bg-zinc-900 border border-zinc-800 text-[11px] rounded-xs px-1.5 py-0.5 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 focus:outline-none focus:border-zinc-600 cursor-pointer transition shrink-0"
          title="Font Family"
        >
          <option value="serif">Georgia</option>
          <option value="garamond">Garamond</option>
          <option value="sans">Inter</option>
          <option value="humanist">Verdana</option>
          <option value="mono">Courier</option>
          <option value="bookman">Bookman</option>
        </select>
      </div>

      {/* Font Size Selector */}
      <div className="flex items-center shrink-0">
        <select
          value={activeFontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="h-6.5 bg-zinc-900 border border-zinc-800 text-[11px] rounded-xs px-1.5 py-0.5 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 focus:outline-none focus:border-zinc-600 cursor-pointer transition shrink-0"
          title="Font Size (px)"
        >
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>
      </div>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Text Styles */}
      <ToolbarButton
        title="Bold (Ctrl+B)"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('bold')}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        title="Italic (Ctrl+I)"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('italic')}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Underline Split / Dropdown Button */}
      <UnderlineColorPicker
        editor={editor}
        isEditorReady={isEditorReady}
        underlineColor={underlineColor}
        onUnderlineColorChange={setUnderlineColor}
      />

      <ToolbarButton
        title="Strikethrough"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('strike')}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Highlighter Split / Dropdown Button */}
      <HighlightColorPicker
        editor={editor}
        isEditorReady={isEditorReady}
        highlightColor={highlightColor}
        onHighlightColorChange={setHighlightColor}
      />

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Text Alignment */}
      <ToolbarButton
        title="Align Left"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive({ textAlign: 'left' })}
        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        title="Align Center"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive({ textAlign: 'center' })}
        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarButton
        title="Align Justify"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify className="w-3.5 h-3.5" />
      </ToolbarButton>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Blockquote */}
      <ToolbarButton
        title="Blockquote"
        disabled={!isEditorReady}
        isActive={isEditorReady && editor.isActive('blockquote')}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>

      {/* Horizontal Divider / Rule */}
      <ToolbarButton
        title="Horizontal Separator (Markdown ---)"
        disabled={!isEditorReady}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="w-3.5 h-3.5" />
      </ToolbarButton>

      <div className="w-px h-3.5 bg-zinc-850 shrink-0 mx-0.5" />

      {/* Writer's Symbols Palette (Icon Only) */}
      <ToolbarButton
        title="Insert Symbol (Word Palette)"
        disabled={!isEditorReady}
        onClick={onOpenSymbols}
      >
        <Omega className="w-3.5 h-3.5 text-emerald-400" />
      </ToolbarButton>
    </div>
  );
}

export default memo(EditorToolbar);
