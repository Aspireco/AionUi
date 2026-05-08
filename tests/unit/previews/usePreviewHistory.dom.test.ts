/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/common', () => ({
  ipcBridge: {
    previewHistory: {
      list: { invoke: vi.fn() },
      save: { invoke: vi.fn() },
      getContent: { invoke: vi.fn() },
    },
  },
}));

import { usePreviewHistory } from '@/renderer/pages/conversation/Preview/hooks/usePreviewHistory';
import { ipcBridge } from '@/common';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Message: {
    useMessage: () => [
      {
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
      },
      null,
    ],
  },
}));

describe('usePreviewHistory', () => {
  const mockActiveTab = {
    content_type: 'markdown',
    content: '# Test',
    title: 'Test Document',
    metadata: {
      file_path: '/path/to/test.md',
      workspace: '/workspace',
    },
  };

  const mockUpdateContent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (ipcBridge.previewHistory.list.invoke as any).mockResolvedValue([]);
    (ipcBridge.previewHistory.save.invoke as any).mockResolvedValue(undefined);
    (ipcBridge.previewHistory.getContent.invoke as any).mockResolvedValue(null);
  });

  it('initializes with empty history', async () => {
    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: mockActiveTab, updateContent: mockUpdateContent })
    );
    await waitFor(() => {
      expect(result.current.historyVersions).toEqual([]);
    });
  });

  it('loads history versions on mount', async () => {
    const mockVersions = [
      { id: 'snap1', timestamp: 1234567890000, preview_text: 'preview' },
      { id: 'snap2', timestamp: 1234567891000, preview_text: 'preview2' },
    ];
    (ipcBridge.previewHistory.list.invoke as any).mockResolvedValue(mockVersions);

    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: mockActiveTab, updateContent: mockUpdateContent })
    );

    await waitFor(() => {
      expect(result.current.historyVersions).toHaveLength(2);
    });
    expect(ipcBridge.previewHistory.list.invoke).toHaveBeenCalledWith({
      target: expect.objectContaining({
        contentType: 'markdown',
        file_path: '/path/to/test.md',
      }),
    });
  });

  it('handles history load error', async () => {
    (ipcBridge.previewHistory.list.invoke as any).mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: mockActiveTab, updateContent: mockUpdateContent })
    );

    await waitFor(() => {
      expect(result.current.historyError).not.toBeNull();
    });
  });

  it('saves snapshot with debounce check', async () => {
    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: mockActiveTab, updateContent: mockUpdateContent })
    );

    await waitFor(() => expect(result.current.historyLoading).toBe(false));

    await act(async () => {
      await result.current.handleSaveSnapshot();
    });

    expect(ipcBridge.previewHistory.save.invoke).toHaveBeenCalledWith({
      target: expect.objectContaining({ contentType: 'markdown' }),
      content: '# Test',
    });
  });

  it('selects snapshot and updates content', async () => {
    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: mockActiveTab, updateContent: mockUpdateContent })
    );

    await waitFor(() => expect(result.current.historyLoading).toBe(false));

    const mockSnapshot = { id: 'snap1', timestamp: 1234567890000, preview_text: 'old content' };
    (ipcBridge.previewHistory.getContent.invoke as any).mockResolvedValue({ content: '# Old Version' });

    await act(async () => {
      await result.current.handleSnapshotSelect(mockSnapshot);
    });

    expect(mockUpdateContent).toHaveBeenCalledWith('# Old Version');
  });

  it('returns null historyTarget when activeTab is null', () => {
    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: null, updateContent: mockUpdateContent })
    );
    expect(result.current.historyTarget).toBeNull();
  });

  it('refreshes history list', async () => {
    (ipcBridge.previewHistory.list.invoke as any).mockResolvedValue([{ id: 'snap1', timestamp: 1234567890000 }]);
    const { result } = renderHook(() =>
      usePreviewHistory({ activeTab: mockActiveTab, updateContent: mockUpdateContent })
    );

    await waitFor(() => expect(result.current.historyVersions).toHaveLength(1));

    (ipcBridge.previewHistory.list.invoke as any).mockResolvedValue([
      { id: 'snap1', timestamp: 1234567890000 },
      { id: 'snap2', timestamp: 1234567891000 },
    ]);

    await act(async () => {
      await result.current.refreshHistory();
    });

    await waitFor(() => {
      expect(result.current.historyVersions).toHaveLength(2);
    });
  });
});
