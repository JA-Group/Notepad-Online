import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

export interface EditorTab {
  id: string;
  name: string;
  content: string;
  language: string;
  fileHandle?: any | null;
  isUnsaved: boolean;
}

const SESSION_KEY = 'notepad-online-session';

export function useEditorTabs() {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session
  useEffect(() => {
    async function loadSession() {
      try {
        const savedSession = await localforage.getItem<{ tabs: EditorTab[]; activeTabId: string | null }>(SESSION_KEY);
        if (savedSession && savedSession.tabs.length > 0) {
          setTabs(savedSession.tabs);
          setActiveTabId(savedSession.activeTabId || savedSession.tabs[0].id);
        } else {
          // Default initial tab
          const newId = uuidv4();
          setTabs([{ id: newId, name: 'Untitled.txt', content: '', language: 'plaintext', isUnsaved: false }]);
          setActiveTabId(newId);
        }
      } catch (err) {
        console.error('Failed to load session', err);
        const newId = uuidv4();
        setTabs([{ id: newId, name: 'Untitled.txt', content: '', language: 'plaintext', isUnsaved: false }]);
        setActiveTabId(newId);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSession();
  }, []);

  // Save session when tabs or active tab changes
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem(SESSION_KEY, { tabs, activeTabId }).catch(err => {
        console.error('Failed to save session', err);
      });
    }
  }, [tabs, activeTabId, isLoaded]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const createNewTab = (name = 'Untitled.txt', content = '', language = 'plaintext', fileHandle = null) => {
    const newTab: EditorTab = {
      id: uuidv4(),
      name,
      content,
      language,
      fileHandle,
      isUnsaved: false,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const updateTab = (id: string, updates: Partial<EditorTab>) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const closeTab = (id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (newTabs.length === 0) {
        const newId = uuidv4();
        setActiveTabId(newId);
        return [{ id: newId, name: 'Untitled.txt', content: '', language: 'plaintext', isUnsaved: false }];
      } else if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  };

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    updateTab,
    closeTab,
    isLoaded,
    setTabs
  };
}
