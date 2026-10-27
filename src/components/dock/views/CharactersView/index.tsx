import { memo } from 'react';
import { Plus, UserPlus, X } from 'lucide-react';
import { CharactersViewProps } from './types';
import { useCharactersState } from './useCharactersState';
import { CharacterAddDrawer } from './CharacterAddDrawer';
import { CharacterEditCard } from './CharacterEditCard';
import { CharacterDisplayCard } from './CharacterDisplayCard';
import { useTranslation } from '../../../../i18n/translations';

const CharacterLightboxModal = memo(function CharacterLightboxModal({
  image,
  onClose,
}: {
  image: { url: string; title: string } | null;
  onClose: () => void;
}) {
  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center cursor-default bg-zinc-950/90 border border-zinc-800 rounded-sm p-2 shadow-2xl"
      >
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-855 px-2">
          <span className="text-xs font-semibold text-zinc-200 truncate">{image.title}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-xs hover:bg-zinc-800 transition cursor-pointer"
            title="Close lightbox"
            aria-label="Close lightbox"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-center overflow-auto max-h-[80vh] w-full p-1">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-[80vh] object-contain rounded-xs shadow-md select-none"
          />
        </div>
      </div>
    </div>
  );
});

export function CharactersViewComponent({
  characters,
  onChange,
  isExpanded = false,
  colorSettings,
  saveMode = 'auto',
  onDirtyChange,
}: CharactersViewProps) {
  const { t } = useTranslation();

  const {
    isAdding,
    setIsAdding,
    newName,
    setNewName,
    newRole,
    setNewRole,
    newSummary,
    setNewSummary,
    editingCharacterId,
    lightboxImage,
    setLightboxImage,
    editName,
    setEditName,
    editRole,
    setEditRole,
    editSummary,
    setEditSummary,
    editTags,
    editFields,
    editAvatarUrl,
    setEditAvatarUrl,
    expandedCharacterIds,
    toggleExpand,
    handleUpdateActiveChar,
    handleAdd,
    handleDelete,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleAddTag,
    handleRemoveTag,
    handleAddField,
    handleUpdateField,
    handleDeleteField,
  } = useCharactersState({ characters, onChange, saveMode, onDirtyChange });

  return (
    <div className="flex flex-col h-full bg-zinc-950 select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-3 py-2 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          {t('charactersView')}
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium transition cursor-pointer ${
            isAdding
              ? 'bg-zinc-800 text-zinc-200'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
          }`}
          title={isAdding ? t('cancel') : t('newCharacter')}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isAdding ? t('cancel') : t('add')}</span>
        </button>
      </div>

      {/* Drawer for adding a new character */}
      {isAdding && (
        <CharacterAddDrawer
          name={newName}
          role={newRole}
          summary={newSummary}
          onNameChange={setNewName}
          onRoleChange={setNewRole}
          onSummaryChange={setNewSummary}
          onCancel={() => setIsAdding(false)}
          onSubmit={handleAdd}
        />
      )}

      {/* Characters List or Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {characters.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-zinc-500 text-xs">
            {t('noCharactersYet')}
          </div>
        ) : (
          <div
            className={
              isExpanded
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start'
                : 'space-y-2'
            }
          >
            {characters.map((char) => {
              const isEditing = editingCharacterId === char.id;
              const isCardOpen = Boolean(expandedCharacterIds[char.id]);

              if (isEditing) {
                return (
                  <CharacterEditCard
                    key={char.id}
                    charId={char.id}
                    charName={char.name}
                    saveMode={saveMode}
                    name={editName}
                    role={editRole}
                    summary={editSummary}
                    avatarUrl={editAvatarUrl}
                    tags={editTags}
                    fields={editFields}
                    onNameChange={(val) => {
                      setEditName(val);
                      handleUpdateActiveChar(char.id, { name: val });
                    }}
                    onRoleChange={(val) => {
                      setEditRole(val);
                      handleUpdateActiveChar(char.id, { role: val });
                    }}
                    onSummaryChange={(val) => {
                      setEditSummary(val);
                      handleUpdateActiveChar(char.id, { summary: val });
                    }}
                    onAvatarChange={(val) => {
                      setEditAvatarUrl(val);
                      handleUpdateActiveChar(char.id, { avatarUrl: val });
                    }}
                    onAddTag={(label, color) => handleAddTag(char.id, label, color)}
                    onRemoveTag={(tagId) => handleRemoveTag(char.id, tagId)}
                    onAddField={(label) => handleAddField(char.id, label)}
                    onUpdateField={(fieldId, updates) =>
                      handleUpdateField(char.id, fieldId, updates)
                    }
                    onDeleteField={(fieldId) => handleDeleteField(char.id, fieldId)}
                    onSave={() => handleSaveEdit(char.id)}
                    onCancel={() => handleCancelEdit()}
                    onClose={() => handleCancelEdit()}
                  />
                );
              }

              return (
                <CharacterDisplayCard
                  key={char.id}
                  char={char}
                  isCardOpen={isCardOpen}
                  colorSettings={colorSettings}
                  onToggleExpand={() => toggleExpand(char.id)}
                  onPortraitClick={() => {
                    if (char.avatarUrl) {
                      setLightboxImage({ url: char.avatarUrl, title: char.name });
                    }
                  }}
                  onEdit={() => handleStartEdit(char)}
                  onDelete={() => handleDelete(char.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Button Footer */}
      {!isAdding && (
        <div className="p-2 border-t border-zinc-850 bg-zinc-950/80">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-sm text-[11px] font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addCharacter')}</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal for Character Portrait */}
      <CharacterLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}

export default memo(CharactersViewComponent);
