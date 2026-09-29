import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEditorTabs } from './useEditorTabs';
import localforage from 'localforage';

vi.mock('localforage', () => {
  return {
    default: {
      getItem: vi.fn(),
      setItem: vi.fn(),
    }
  }
});

describe('useEditorTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (localforage.getItem as any).mockResolvedValue(null);
    (localforage.setItem as any).mockResolvedValue(undefined);
  });

  it('should initialize with a default tab if no session is saved', async () => {
    const { result } = renderHook(() => useEditorTabs());

    expect(result.current.isLoaded).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].name).toBe('Untitled.txt');
    expect(result.current.activeTabId).toBe(result.current.tabs[0].id);
  });

  it('should load session from localforage if available', async () => {
    const savedSession = {
      tabs: [{ id: 'tab-1', name: 'Saved.txt', content: 'hello', language: 'plaintext', isUnsaved: false }],
      activeTabId: 'tab-1'
    };
    (localforage.getItem as any).mockResolvedValue(savedSession);

    const { result } = renderHook(() => useEditorTabs());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].name).toBe('Saved.txt');
    expect(result.current.activeTabId).toBe('tab-1');
  });

  it('should create a new tab', async () => {
    const { result } = renderHook(() => useEditorTabs());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.createNewTab('NewFile.ts', 'console.log("hi")', 'typescript');
    });

    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.tabs[1].name).toBe('NewFile.ts');
    expect(result.current.activeTabId).toBe(result.current.tabs[1].id);
  });

  it('should update an existing tab', async () => {
    const { result } = renderHook(() => useEditorTabs());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const activeTabId = result.current.activeTabId!;

    act(() => {
      result.current.updateTab(activeTabId, { content: 'updated content', isUnsaved: true });
    });

    expect(result.current.tabs[0].content).toBe('updated content');
    expect(result.current.tabs[0].isUnsaved).toBe(true);
  });

  it('should close a tab and set active to the previous one', async () => {
    const { result } = renderHook(() => useEditorTabs());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.createNewTab('File2.txt');
    });

    expect(result.current.tabs).toHaveLength(2);
    const tab2Id = result.current.activeTabId!;

    act(() => {
      result.current.closeTab(tab2Id);
    });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabId).toBe(result.current.tabs[0].id);
  });

  it('should create a new untitled tab if the last tab is closed', async () => {
    const { result } = renderHook(() => useEditorTabs());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const activeTabId = result.current.activeTabId!;

    act(() => {
      result.current.closeTab(activeTabId);
    });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].name).toBe('Untitled.txt');
    expect(result.current.activeTabId).toBe(result.current.tabs[0].id);
    expect(result.current.tabs[0].id).not.toBe(activeTabId);
  });
});
