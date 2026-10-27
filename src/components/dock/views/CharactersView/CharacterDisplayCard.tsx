import { memo } from 'react';
import { Pencil, Trash2, ChevronRight, ChevronDown, User } from 'lucide-react';
import { CharacterItem, CharacterCustomField, CharacterTag } from './types';
import {
  AppColorSettings,
  COLOR_SWATCHES,
  DEFAULT_COLOR_SETTINGS,
} from '../../../../types/settings';
import { CharacterTagBadge } from './CharacterTagBadge';
import { useTranslation, getRoleLabel } from '../../../../i18n/translations';

const CharacterRoleBadge = memo(function CharacterRoleBadge({
  role,
  colorSettings,
}: {
  role: CharacterItem['role'];
  colorSettings?: AppColorSettings;
}) {
  const { t } = useTranslation();
  const roleKey = role ?? 'Minor';
  const colorKey =
    colorSettings?.roles[roleKey] ??
    DEFAULT_COLOR_SETTINGS.roles[roleKey] ??
    'zinc';
  const swatch = COLOR_SWATCHES[colorKey] ?? COLOR_SWATCHES.zinc;

  return (
    <span
      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs border ${swatch.badgeBg} ${swatch.badgeBorder} ${swatch.badgeText}`}
    >
      {getRoleLabel(role, t)}
    </span>
  );
});

interface CharacterDisplayCardProps {
  char: CharacterItem;
  isCardOpen: boolean;
  colorSettings?: AppColorSettings;
  onToggleExpand: () => void;
  onPortraitClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CharacterDisplayCard = memo(function CharacterDisplayCard({
  char,
  isCardOpen,
  colorSettings,
  onToggleExpand,
  onPortraitClick,
  onEdit,
  onDelete,
}: CharacterDisplayCardProps) {
  const { t } = useTranslation();
  const tags = char.tags || [];
  const fields = char.fields || [];

  return (
    <div className="group border border-zinc-855 rounded-sm bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition overflow-hidden">
      {/* Collapsed Header Bar (Always visible) */}
      <div
        onClick={onToggleExpand}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-zinc-850/50 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar / Profile Image with Lightbox click */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (char.avatarUrl) {
                onPortraitClick();
              }
            }}
            className={`w-7 h-7 rounded-xs bg-zinc-850 border border-zinc-750 overflow-hidden flex items-center justify-center text-zinc-300 font-bold text-[10px] shrink-0 font-mono transition relative shadow-xs select-none ${
              char.avatarUrl ? 'cursor-pointer hover:border-zinc-400 hover:ring-1 hover:ring-zinc-400/40' : ''
            }`}
            title={char.avatarUrl ? 'Click to view portrait' : char.name}
          >
            {char.avatarUrl ? (
              <img
                src={char.avatarUrl}
                alt={char.name}
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            ) : char.name ? (
              char.name.charAt(0).toUpperCase()
            ) : (
              <User className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </div>

          <div className="min-w-0">
            <span className="text-xs font-semibold text-zinc-100 truncate block">
              {char.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <CharacterRoleBadge role={char.role} colorSettings={colorSettings} />

          <button
            type="button"
            onClick={onEdit}
            title={t('editCharacterProfile')}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title={t('deleteCharacter')}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-xs transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            title={isCardOpen ? 'Collapse card' : 'Expand card'}
            aria-label={isCardOpen ? 'Collapse card' : 'Expand card'}
            className="text-zinc-500 ml-0.5 hover:text-zinc-300 transition p-0.5 cursor-pointer"
          >
            {isCardOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isCardOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-850 bg-zinc-950/40 text-xs space-y-2">
          {char.summary && (
            <p className="text-zinc-300 italic text-[11px] leading-relaxed">
              {char.summary}
            </p>
          )}

          {char.notes && (
            <p className="text-zinc-400 text-[11px] whitespace-pre-wrap leading-relaxed">
              {char.notes}
            </p>
          )}

          {/* Tags preview */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.map((tag: CharacterTag) => (
                <CharacterTagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          {/* Custom Fields list */}
          {fields.length > 0 && (
            <div className="pt-2 border-t border-zinc-850/80 space-y-1">
              {fields.map((f: CharacterCustomField) => (
                <div key={f.id} className="flex items-baseline justify-between gap-2 text-[10px] font-mono">
                  <span className="text-zinc-500">{f.label}:</span>
                  <span className="text-zinc-300 truncate max-w-[60%]">{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
