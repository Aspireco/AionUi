/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for process/utils/runBackendMigrations.ts (A12 in N4a).
 * Tests migration orchestrator: ordering, allSucceeded flag, and partial-failure tolerance.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/common/config/configMigration', () => ({
  migrateConfigStorage: vi.fn(),
  migrateProviders: vi.fn(),
}));

vi.mock('@/common/adapter/httpBridge', () => ({
  httpRequest: vi.fn(),
}));

vi.mock('./migrateAssistants', () => ({
  migrateAssistantsToBackend: vi.fn(),
}));

import { runBackendMigrations } from '@/process/utils/runBackendMigrations';
import { migrateConfigStorage, migrateProviders } from '@/common/config/configMigration';
import { httpRequest } from '@/common/adapter/httpBridge';
import { migrateAssistantsToBackend } from '@/process/utils/migrateAssistants';

describe('runBackendMigrations', () => {
  const mockConfigFile = {
    get: vi.fn(),
    set: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigFile.get.mockResolvedValue(false); // migration.electronConfigImported = false by default
  });

  it('runs all migration steps in order when all succeed', async () => {
    (httpRequest as any).mockResolvedValue(undefined);
    (migrateConfigStorage as any).mockResolvedValue(undefined);
    (migrateProviders as any).mockResolvedValue(undefined);
    (migrateAssistantsToBackend as any).mockResolvedValue(true);

    await runBackendMigrations(mockConfigFile);

    expect(httpRequest).toHaveBeenCalledTimes(1); // cleanup step
    expect(migrateConfigStorage).toHaveBeenCalledTimes(1);
    expect(migrateProviders).toHaveBeenCalledTimes(1);
    expect(migrateAssistantsToBackend).toHaveBeenCalledTimes(1);
    expect(mockConfigFile.set).toHaveBeenCalledWith('migration.electronConfigImported', true);
  });

  it('skips migration steps if already imported', async () => {
    mockConfigFile.get.mockResolvedValue(true); // migration.electronConfigImported = true

    await runBackendMigrations(mockConfigFile);

    expect(httpRequest).toHaveBeenCalledTimes(1); // cleanup still runs
    expect(migrateConfigStorage).not.toHaveBeenCalled();
    expect(migrateProviders).not.toHaveBeenCalled();
    expect(migrateAssistantsToBackend).not.toHaveBeenCalled();
  });

  it('tolerates cleanup step failure and continues to migration steps', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (httpRequest as any).mockRejectedValue(new Error('Cleanup failed'));
    (migrateConfigStorage as any).mockResolvedValue(undefined);
    (migrateProviders as any).mockResolvedValue(undefined);
    (migrateAssistantsToBackend as any).mockResolvedValue(true);

    await runBackendMigrations(mockConfigFile);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(migrateConfigStorage).toHaveBeenCalled(); // still runs
    expect(mockConfigFile.set).not.toHaveBeenCalledWith('migration.electronConfigImported', true); // allSucceeded = false

    consoleErrorSpy.mockRestore();
  });

  it('tolerates migrateConfigStorage failure and continues', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (httpRequest as any).mockResolvedValue(undefined);
    (migrateConfigStorage as any).mockRejectedValue(new Error('Config migration failed'));
    (migrateProviders as any).mockResolvedValue(undefined);
    (migrateAssistantsToBackend as any).mockResolvedValue(true);

    await runBackendMigrations(mockConfigFile);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(migrateProviders).toHaveBeenCalled(); // still runs
    expect(migrateAssistantsToBackend).toHaveBeenCalled(); // still runs
    expect(mockConfigFile.set).not.toHaveBeenCalledWith('migration.electronConfigImported', true); // allSucceeded = false

    consoleErrorSpy.mockRestore();
  });

  it('tolerates migrateProviders failure and continues', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (httpRequest as any).mockResolvedValue(undefined);
    (migrateConfigStorage as any).mockResolvedValue(undefined);
    (migrateProviders as any).mockRejectedValue(new Error('Providers migration failed'));
    (migrateAssistantsToBackend as any).mockResolvedValue(true);

    await runBackendMigrations(mockConfigFile);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(migrateAssistantsToBackend).toHaveBeenCalled(); // still runs
    expect(mockConfigFile.set).not.toHaveBeenCalledWith('migration.electronConfigImported', true); // allSucceeded = false

    consoleErrorSpy.mockRestore();
  });

  it('tolerates migrateAssistantsToBackend failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (httpRequest as any).mockResolvedValue(undefined);
    (migrateConfigStorage as any).mockResolvedValue(undefined);
    (migrateProviders as any).mockResolvedValue(undefined);
    (migrateAssistantsToBackend as any).mockRejectedValue(new Error('Assistants migration failed'));

    await runBackendMigrations(mockConfigFile);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockConfigFile.set).not.toHaveBeenCalledWith('migration.electronConfigImported', true); // allSucceeded = false

    consoleErrorSpy.mockRestore();
  });

  it('verifies ordering: configStorage → providers → assistants', async () => {
    const callOrder: string[] = [];
    (migrateConfigStorage as any).mockImplementation(async () => { callOrder.push('config'); });
    (migrateProviders as any).mockImplementation(async () => { callOrder.push('providers'); });
    (migrateAssistantsToBackend as any).mockImplementation(async () => { callOrder.push('assistants'); return true; });

    await runBackendMigrations(mockConfigFile);

    expect(callOrder).toEqual(['config', 'providers', 'assistants']);
  });
});
