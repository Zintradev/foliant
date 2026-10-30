import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkForAppUpdates } from './updater';
import * as platform from './platform';
import { DEFAULT_PREFERENCES, loadSettings, saveSettings } from '../types/settings';

// Mock dialog and updater plugins
const mockCheck = vi.fn();
const mockRelaunch = vi.fn();
const mockAsk = vi.fn();
const mockMessage = vi.fn();

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: () => mockCheck(),
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: () => mockRelaunch(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  ask: (...args: unknown[]) => mockAsk(...args),
  message: (...args: unknown[]) => mockMessage(...args),
}));

describe('Updater Opt-In & Local-First Defaults', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('defaults autoUpdateCheck to false (100% local-first opt-in)', () => {
    expect(DEFAULT_PREFERENCES.autoUpdateCheck).toBe(false);
    const settings = loadSettings();
    expect(settings.preferences.autoUpdateCheck).toBe(false);
  });

  it('persists and loads autoUpdateCheck when user enables it', () => {
    const settings = loadSettings();
    settings.preferences.autoUpdateCheck = true;
    saveSettings(settings);

    const loaded = loadSettings();
    expect(loaded.preferences.autoUpdateCheck).toBe(true);
  });
});

describe('checkForAppUpdates Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not-desktop status when running outside of Tauri', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(false);

    const result = await checkForAppUpdates({ silent: true });
    expect(result.status).toBe('not-desktop');
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('safely warns when running outside of Tauri without calling updater plugin', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(false);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await checkForAppUpdates({ silent: false, language: 'es' });
    expect(result.status).toBe('not-desktop');
    expect(warnSpy).toHaveBeenCalled();
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it('handles up-to-date state correctly when no update is found', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(true);
    mockCheck.mockResolvedValue(null);

    const statusChanges: string[] = [];
    const result = await checkForAppUpdates({
      silent: false,
      language: 'es',
      onStatusChange: (status) => statusChanges.push(status),
    });

    expect(result.status).toBe('up-to-date');
    expect(statusChanges).toContain('checking');
    expect(statusChanges).toContain('up-to-date');
    expect(mockMessage).not.toHaveBeenCalled();
  });

  it('prompts user and installs/restarts when update is available and accepted', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(true);
    const mockDownloadAndInstall = vi.fn().mockResolvedValue(undefined);
    mockCheck.mockResolvedValue({
      version: '0.2.0',
      currentVersion: '0.1.0',
      downloadAndInstall: mockDownloadAndInstall,
    });
    mockAsk.mockResolvedValue(true);

    const statusChanges: string[] = [];
    const result = await checkForAppUpdates({
      silent: false,
      language: 'es',
      onStatusChange: (status) => statusChanges.push(status),
    });

    expect(mockAsk).toHaveBeenCalled();
    expect(mockDownloadAndInstall).toHaveBeenCalled();
    expect(mockRelaunch).toHaveBeenCalled();
    expect(result.status).toBe('updated');
    expect(result.version).toBe('0.2.0');
    expect(statusChanges).toContain('downloading');
    expect(statusChanges).toContain('restarting');
  });

  it('cancels installation when user rejects update prompt', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(true);
    const mockDownloadAndInstall = vi.fn().mockResolvedValue(undefined);
    mockCheck.mockResolvedValue({
      version: '0.2.0',
      currentVersion: '0.1.0',
      downloadAndInstall: mockDownloadAndInstall,
    });
    mockAsk.mockResolvedValue(false);

    const result = await checkForAppUpdates({ silent: false, language: 'en' });

    expect(mockAsk).toHaveBeenCalled();
    expect(mockDownloadAndInstall).not.toHaveBeenCalled();
    expect(mockRelaunch).not.toHaveBeenCalled();
    expect(result.status).toBe('cancelled');
  });

  it('handles "could not fetch a valid release json" gracefully without technical error dialog', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(true);
    mockCheck.mockRejectedValue(new Error('could not fetch a valid release json from endpoint'));

    const result = await checkForAppUpdates({ silent: false, language: 'es' });

    expect(result.status).toBe('up-to-date');
    expect(mockMessage).not.toHaveBeenCalled();
  });

  it('handles non-fetch unexpected errors gracefully', async () => {
    vi.spyOn(platform, 'isTauriApp').mockReturnValue(true);
    mockCheck.mockRejectedValue(new Error('Cryptographic signature verification failed'));

    const result = await checkForAppUpdates({ silent: false, language: 'es' });

    expect(result.status).toBe('error');
    expect(result.error).toContain('Cryptographic signature verification failed');
    expect(mockMessage).toHaveBeenCalledWith(
      expect.stringContaining('Cryptographic signature verification failed'),
      expect.objectContaining({ kind: 'error' })
    );
  });
});

