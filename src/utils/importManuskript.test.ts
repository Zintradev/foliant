import { describe, it, expect } from 'vitest';
import {
  parseFolderMetadata,
  parseSceneMarkdown,
  parseCharacterFile,
  cleanTitle,
  compareNumericPrefixes,
} from './importManuskript';

describe('importManuskript - parseFolderMetadata', () => {
  it('extracts title correctly from folder.txt key-value content', () => {
    const raw = `ID: 0\ntype: 0\ntitle: PART I SECRETS\ncompile: 1`;
    const title = parseFolderMetadata(raw, 'Default Folder');
    expect(title).toBe('PART I SECRETS');
  });

  it('falls back to default title if title key is missing or empty', () => {
    const raw = `ID: 0\ntype: 0\ncompile: 1`;
    const title = parseFolderMetadata(raw, 'Fallback Folder');
    expect(title).toBe('Fallback Folder');
  });
});

describe('importManuskript - parseSceneMarkdown', () => {
  it('parses metadata lines at the top and wraps subsequent prose lines in <p> tags', () => {
    const raw = `title: The Awakening
ID: 15
type: 1
compile: 1
charCount: 230

Rain tapped softly against the window glass as the clock struck midnight.
Ara opened her eyes with a sudden start.`;

    const { title, content } = parseSceneMarkdown(raw, 'Fallback Scene');
    expect(title).toBe('The Awakening');
    expect(content).toBe(
      '<p>Rain tapped softly against the window glass as the clock struck midnight.</p>' +
      '<p>Ara opened her eyes with a sudden start.</p>'
    );
  });

  it('transforms markdown asterisks into <em> tags for TipTap rich text', () => {
    const raw = `title: Midnight Whisper
ID: 40

She heard a *faint* voice in the *darkness*.
*Could it be real?*`;

    const { title, content } = parseSceneMarkdown(raw, 'Fallback Scene');
    expect(title).toBe('Midnight Whisper');
    expect(content).toBe(
      '<p>She heard a <em>faint</em> voice in the <em>darkness</em>.</p>' +
      '<p><em>Could it be real?</em></p>'
    );
  });

  it('handles narrative text starting immediately after rare metadata without blank lines', () => {
    const raw = `title: The Escape
setGoal: 2000
references: ch1_outline
custom_tag: urgent
The horses dashed through the thick forest without looking back.
Branches whipped against their faces in the dark.`;

    const { title, content } = parseSceneMarkdown(raw, 'Fallback');
    expect(title).toBe('The Escape');
    expect(content).toBe(
      '<p>The horses dashed through the thick forest without looking back.</p>' +
      '<p>Branches whipped against their faces in the dark.</p>'
    );
  });

  it('ignores leading blank lines of prose and filters out empty lines between paragraphs', () => {
    const raw = `title: Empty Line Test
ID: 88



First paragraph after multiple blank lines.

Second paragraph after an empty line.`;

    const { title, content } = parseSceneMarkdown(raw, 'Fallback');
    expect(title).toBe('Empty Line Test');
    expect(content).toBe(
      '<p>First paragraph after multiple blank lines.</p>' +
      '<p>Second paragraph after an empty line.</p>'
    );
  });

  it('uses fallback title when title key is absent in metadata', () => {
    const raw = `ID: 99
compile: 1
setGoal: 1500

Prose without explicit metadata title.`;

    const { title, content } = parseSceneMarkdown(raw, 'Fallback Title');
    expect(title).toBe('Fallback Title');
    expect(content).toBe('<p>Prose without explicit metadata title.</p>');
  });

  it('returns empty content when the file contains only metadata', () => {
    const raw = `title: Empty Scene
ID: 101
compile: 1
charCount: 0`;

    const { title, content } = parseSceneMarkdown(raw, 'Fallback');
    expect(title).toBe('Empty Scene');
    expect(content).toBe('');
  });
});

describe('importManuskript - parseCharacterFile', () => {
  it('parses character key-values with colons and creates fields and summary', () => {
    const raw = `Name: Ara
Role: Protagonist
Motivation: Protect her younger brother
Goal: Retrieve the moon relic
Conflict: Distrust toward the kingdom council
Epiphany: She must learn to trust her companions
Phrase Summary: A solitary, resolute warrior`;

    const char = parseCharacterFile(raw, 'Default Char');
    expect(char.name).toBe('Ara');
    expect(char.role).toBe('Protagonist');
    expect(char.fields).toBeDefined();
    expect(char.fields?.some((f) => f.label === 'Motivation' && f.value === 'Protect her younger brother')).toBe(true);
    expect(char.fields?.some((f) => f.label === 'Goal' && f.value === 'Retrieve the moon relic')).toBe(true);
    expect(char.summary).toContain('Motivation: Protect her younger brother');
    expect(char.summary).toContain('Goal: Retrieve the moon relic');
  });

  it('strictly ignores internal Manuskript metadata (ID, Importance, POV, Color, compile, charCount, setGoal)', () => {
    const raw = `ID: 42
Importance: Main
POV: 1
Color: #e11d48
compile: 1
charCount: 2840
setGoal: 5000
Name: Brandon Stark
Motivation: Understand the visions of the raven
Goal: Protect the realm from eternal winter
Conflict: Physical impairment and family duty
Epiphany: The past is already written, the ink is dry
Notes: Training beyond the Wall
Appearance: Dark eyes and wool tunic`;

    const char = parseCharacterFile(raw, 'Default Char');
    expect(char.name).toBe('Brandon Stark');
    expect(char.fields).toBeDefined();

    const fieldLabels = char.fields?.map((f) => f.label.toLowerCase()) ?? [];
    expect(fieldLabels).not.toContain('id');
    expect(fieldLabels).not.toContain('importance');
    expect(fieldLabels).not.toContain('pov');
    expect(fieldLabels).not.toContain('color');
    expect(fieldLabels).not.toContain('compile');
    expect(fieldLabels).not.toContain('charcount');
    expect(fieldLabels).not.toContain('setgoal');
    expect(fieldLabels).not.toContain('name');

    expect(char.fields?.some((f) => f.label === 'Motivation' && f.value === 'Understand the visions of the raven')).toBe(true);
    expect(char.fields?.some((f) => f.label === 'Goal' && f.value === 'Protect the realm from eternal winter')).toBe(true);
    expect(char.fields?.some((f) => f.label === 'Conflict' && f.value === 'Physical impairment and family duty')).toBe(true);
    expect(char.fields?.some((f) => f.label === 'Epiphany' && f.value === 'The past is already written, the ink is dry')).toBe(true);
    expect(char.fields?.some((f) => f.label === 'Notes' && f.value === 'Training beyond the Wall')).toBe(true);
    expect(char.fields?.some((f) => f.label === 'Appearance' && f.value === 'Dark eyes and wool tunic')).toBe(true);

    expect(char.fields?.every((f) => typeof f.id === 'string' && f.id.length > 0)).toBe(true);

    expect(char.summary).not.toContain('ID:');
    expect(char.summary).not.toContain('Importance:');
    expect(char.summary).not.toContain('POV:');
    expect(char.summary).not.toContain('Color:');
    expect(char.summary).not.toContain('compile:');
  });

  it('captures freeform narrative notes after header separator line', () => {
    const raw = `Name: Elara
Motivation: Discover ancient magic

Elara grew up in the hidden mountain sanctuaries.
She carries a mysterious sapphire pendant.`;

    const char = parseCharacterFile(raw, 'Default');
    expect(char.name).toBe('Elara');
    expect(char.fields?.some((f) => f.label === 'Notes' && f.value.includes('hidden mountain sanctuaries'))).toBe(true);
  });

  it('handles tab/space separated lines and missing Name key gracefully', () => {
    const raw = `Motivation\tUncover the truth
Goal  Avenge the fallen`;

    const char = parseCharacterFile(raw, 'Fallback Ara');
    expect(char.name).toBe('Fallback Ara');
    expect(char.fields?.length).toBe(2);
    expect(char.summary).toContain('Motivation: Uncover the truth');
  });
});

describe('importManuskript - cleanTitle', () => {
  it('strips numeric prefixes and file extensions', () => {
    expect(cleanTitle('01 - Chapter One.md')).toBe('Chapter One');
    expect(cleanTitle('0-Prologue.markdown')).toBe('Prologue');
    expect(cleanTitle('12_Epilogue.txt')).toBe('Epilogue');
    expect(cleanTitle('NoPrefix')).toBe('NoPrefix');
  });
});

describe('importManuskript - compareNumericPrefixes', () => {
  it('correctly sorts numerically prefixed files and directories (0- before 1-, 2- before 10-)', () => {
    const unsorted = [
      '10-Epilogue',
      '0-Prologue',
      '2-Chapter 2',
      '1-Chapter 1',
      'folder.txt',
    ];

    const sorted = [...unsorted].sort(compareNumericPrefixes);
    expect(sorted).toEqual([
      '0-Prologue',
      '1-Chapter 1',
      '2-Chapter 2',
      '10-Epilogue',
      'folder.txt',
    ]);
  });

  it('falls back to locale comparison when numbers are absent', () => {
    const unsorted = ['Beta', 'Alpha', 'Gamma'];
    const sorted = [...unsorted].sort(compareNumericPrefixes);
    expect(sorted).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});
