import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import { CharacterItem } from '../../types/dock';
import {
  AppColorSettings,
  COLOR_SWATCHES,
  DEFAULT_COLOR_SETTINGS,
} from '../../types/settings';

interface CharactersStudioViewProps {
  characters: CharacterItem[];
  onChange: (characters: CharacterItem[]) => void;
  colorSettings?: AppColorSettings;
}

export default function CharactersStudioView({
  characters,
  onChange,
  colorSettings,
}: CharactersStudioViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CharacterItem['role']>('Protagonist');
  const [newSummary, setNewSummary] = useState('');

  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        selectedRole === 'all' || c.role.toLowerCase() === selectedRole.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [characters, searchQuery, selectedRole]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newChar: CharacterItem = {
      id: `char-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      summary: newSummary.trim() || 'No detailed dossier yet.',
    };
    onChange([...characters, newChar]);
    setNewName('');
    setNewSummary('');
    setNewRole('Supporting');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onChange(characters.filter((c) => c.id !== id));
  };

  // Pure color-coded role badge without redundant icons
  const getRoleBadge = (role: CharacterItem['role']) => {
    const roleKey = role ?? 'Minor';
    const colorKey =
      colorSettings?.roles[roleKey] ??
      DEFAULT_COLOR_SETTINGS.roles[roleKey] ??
      'zinc';
    const swatch = COLOR_SWATCHES[colorKey] ?? COLOR_SWATCHES.zinc;

    return (
      <span
        className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border ${swatch.badgeBg} ${swatch.badgeBorder} ${swatch.badgeText}`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 select-none overflow-hidden">
      {/* Top Header & Search Toolbar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Users className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Characters & Cast
            </h1>
            <p className="text-[11px] text-zinc-400">
              Manage your novel's cast, character arcs, and narrative motivations
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 w-48 transition"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-sm px-2 py-1">
            <Filter className="w-3 h-3 text-zinc-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="supporting">Supporting</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Character</span>
          </button>
        </div>
      </header>

      {/* Main Studio Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950">
        <div className="w-full max-w-[1800px] mx-auto space-y-6">
          {/* Inline Character Creation Drawer */}
          {isAdding && (
            <div className="p-5 rounded-sm border border-zinc-750 bg-zinc-900 shadow-xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Create Character Dossier
                </span>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Character Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Inspector Vance"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Story Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as CharacterItem['role'])}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Supporting">Supporting</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">
                  Dossier, Background, & Arc
                </label>
                <textarea
                  placeholder="Describe appearance, internal conflict, allegiances, and story arc..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-sm text-xs text-zinc-400 hover:text-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="px-4 py-1.5 rounded-sm text-xs font-medium bg-zinc-200 hover:bg-white text-zinc-950 disabled:opacity-50 transition"
                >
                  Save Character
                </button>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {filteredCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 gap-3 border border-dashed border-zinc-850 rounded-sm">
              <Users className="w-8 h-8 text-zinc-600" />
              <div>
                <p className="text-sm font-medium text-zinc-300">No characters found</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Try adjusting your search criteria or create a new character.
                </p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-2 px-3 py-1.5 rounded-sm text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition"
              >
                + Add Character
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className="group relative border border-zinc-850 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-750 transition p-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-zinc-850 border border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                          {char.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition">
                            {char.name}
                          </h3>
                          <div className="mt-1">{getRoleBadge(char.role)}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(char.id)}
                        title="Delete character"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-4">
                      {char.summary}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="pt-3 mt-3 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>ID: {char.id}</span>
                    <span className="text-zinc-600">Foliant Cast</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
