import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Save, FolderOpen, FileText, X, Moon, Sun, Search, ZoomIn, ZoomOut, WrapText, PanelLeft, Copy, ArrowUp, ArrowDown, Columns } from 'lucide-react';
import { useEditorTabs } from './hooks/useEditorTabs';
import Sidebar from './components/Sidebar';
import './index.css';

const SUPPORTED_LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'html', 'css', 'json', 'python', 'cpp', 'c', 'java', 'xml', 'sql', 'markdown', 'php', 'ruby', 'go', 'rust', 'csharp'
];

export default function App() {
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    updateTab,
    closeTab,
    isLoaded
  } = useEditorTabs();

  const [lineCount, setLineCount] = useState(1);
  const [colCount, setColCount] = useState(1);
  const [theme, setTheme] = useState<'vs-light' | 'vs-dark'>('vs-light');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSplit, setIsSplit] = useState(false);
  
  const encoding = 'UTF-8';
  const editorRef = useRef<any>(null);
  const editorRefRight = useRef<any>(null);

  useEffect(() => {
    // Load theme from localStorage if possible
    const savedTheme = localStorage.getItem('notepad-theme');
    if (savedTheme === 'vs-dark' || savedTheme === 'vs-light') {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'vs-light' ? 'vs-dark' : 'vs-light';
    setTheme(newTheme);
    localStorage.setItem('notepad-theme', newTheme);
  };

  const zoomIn = () => setFontSize(prev => Math.min(prev + 2, 40));
  const zoomOut = () => setFontSize(prev => Math.max(prev - 2, 8));
  const toggleWordWrap = () => setWordWrap(prev => prev === 'on' ? 'off' : 'on');
  
  const triggerSearch = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'actions.find', null);
    }
  };

  const duplicateLine = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.copyLinesDownAction', null);
    }
  };

  const moveLineUp = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.moveLinesUpAction', null);
    }
  };

  const moveLineDown = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.moveLinesDownAction', null);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Register cursor position change event
    editor.onDidChangeCursorPosition((e: any) => {
      setLineCount(e.position.lineNumber);
      setColCount(e.position.column);
    });
  };

  const verifyPermission = async (fileHandle: any, readWrite: boolean = true) => {
    const options = { mode: readWrite ? 'readwrite' : 'read' };
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await fileHandle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  };

  const openFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Text Files',
            accept: {
              'text/plain': ['.txt', '.md', '.csv'],
              'text/html': ['.html', '.htm'],
              'text/css': ['.css'],
              'application/json': ['.json'],
              'application/javascript': ['.js', '.jsx'],
              'application/typescript': ['.ts', '.tsx'],
            },
          },
        ],
        excludeAcceptAllOption: false,
      });
      const file = await handle.getFile();
      const text = await file.text();
      
      let language = 'plaintext';
      if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) language = 'javascript';
      else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) language = 'typescript';
      else if (file.name.endsWith('.html')) language = 'html';
      else if (file.name.endsWith('.css')) language = 'css';
      else if (file.name.endsWith('.json')) language = 'json';
      
      createNewTab(file.name, text, language, handle);
      
    } catch (err) {
      console.log('User cancelled or error:', err);
    }
  };

  const openFileFromHandle = async (handle: any) => {
    try {
      const file = await handle.getFile();
      const text = await file.text();
      
      let language = 'plaintext';
      if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) language = 'javascript';
      else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) language = 'typescript';
      else if (file.name.endsWith('.html')) language = 'html';
      else if (file.name.endsWith('.css')) language = 'css';
      else if (file.name.endsWith('.json')) language = 'json';
      
      // Check if file is already open
      const existingTab = tabs.find(t => t.name === file.name);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        createNewTab(file.name, text, language, handle);
      }
    } catch (err) {
      console.error('Error opening file from sidebar:', err);
    }
  };

  const saveFile = async () => {
    try {
      if (!editorRef.current || !activeTab) return;
      
      const currentContent = editorRef.current.getValue();
      let handleToUse = activeTab.fileHandle;
      
      if (!handleToUse) {
        handleToUse = await (window as any).showSaveFilePicker({
          suggestedName: activeTab.name,
          types: [{
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] },
          }],
        });
      } else {
        const hasPermission = await verifyPermission(handleToUse, true);
        if (!hasPermission) {
          console.error('No permission to save file');
          return;
        }
      }
      
      // Update state before writing to ensure UI is snappy
      updateTab(activeTab.id, { 
        content: currentContent, 
        fileHandle: handleToUse,
        name: handleToUse.name,
        isUnsaved: false 
      });
      
      const writable = await handleToUse.createWritable();
      await writable.write(currentContent);
      await writable.close();
      
    } catch (err) {
      console.error('Error saving file:', err);
    }
  };

  const onEditorChange = (val: string | undefined) => {
    if (activeTabId && val !== undefined) {
      updateTab(activeTabId, { content: val, isUnsaved: true });
    }
  };

  if (!isLoaded) {
    return <div style={{ padding: 20 }}>Loading session...</div>;
  }

  return (
    <div className={`app-container ${theme === 'vs-dark' ? 'dark-mode' : ''}`}>
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item" onClick={() => createNewTab()}>File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">Search</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Encoding</div>
        <div className="menu-item">Language</div>
        <div className="menu-item" onClick={toggleTheme}>Theme</div>
        <div className="menu-item">?</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className={`toolbar-btn ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Toggle Sidebar">
          <PanelLeft size={16} />
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" onClick={() => createNewTab()} title="New File" data-testid="new-file-btn">
          <FileText size={16} />
        </button>
        <button className="toolbar-btn" onClick={openFile} title="Open File">
          <FolderOpen size={16} />
        </button>
        <button className="toolbar-btn" onClick={saveFile} title="Save File">
          <Save size={16} />
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" onClick={triggerSearch} title="Search & Replace">
          <Search size={16} />
        </button>
        <button className="toolbar-btn" onClick={duplicateLine} title="Duplicate Line">
          <Copy size={16} />
        </button>
        <button className="toolbar-btn" onClick={moveLineUp} title="Move Line Up">
          <ArrowUp size={16} />
        </button>
        <button className="toolbar-btn" onClick={moveLineDown} title="Move Line Down">
          <ArrowDown size={16} />
        </button>
        <button className="toolbar-btn" onClick={zoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="toolbar-btn" onClick={zoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button className={`toolbar-btn ${isSplit ? 'active' : ''}`} onClick={() => setIsSplit(!isSplit)} title="Split Editor">
          <Columns size={16} />
        </button>
        <button className="toolbar-btn" onClick={toggleWordWrap} title={`Word Wrap (${wordWrap})`}>
          <WrapText size={16} />
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" onClick={() => activeTabId && closeTab(activeTabId)} title="Close Current File">
          <X size={16} />
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'vs-light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="main-area">
        {isSidebarOpen && <Sidebar onOpenFile={openFileFromHandle} />}
        
        <div className="editor-area">
          {/* Tab bar */}
          <div className="tab-bar">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="tab-title">
                  {tab.name} {tab.isUnsaved ? '*' : ''}
                </span>
                <button 
                  className="tab-close-btn" 
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="editor-container" style={{ display: 'flex', width: '100%' }}>
            {activeTab && (
              <>
                <div style={{ flex: 1, borderRight: isSplit ? '1px solid var(--border-color)' : 'none', minWidth: 0 }}>
                  <Editor
                    key={`left-${activeTab.id}`}
                    path={`left-${activeTab.id}`}
                    height="100%"
                    language={activeTab.language}
                    theme={theme}
                    value={activeTab.content}
                    onChange={onEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: true },
                      wordWrap: wordWrap,
                      fontSize: fontSize,
                      fontFamily: "'Consolas', 'Courier New', monospace"
                    }}
                  />
                </div>
                {isSplit && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Editor
                      key={`right-${activeTab.id}`}
                      path={`right-${activeTab.id}`}
                      height="100%"
                      language={activeTab.language}
                      theme={theme}
                      value={activeTab.content}
                      onChange={onEditorChange}
                      onMount={(editor) => { editorRefRight.current = editor; }}
                      options={{
                        minimap: { enabled: true },
                        wordWrap: wordWrap,
                        fontSize: fontSize,
                        fontFamily: "'Consolas', 'Courier New', monospace"
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-section">
          <span className="status-item">
            <select
              value={activeTab?.language || 'plaintext'}
              onChange={(e) => {
                if (activeTabId) {
                  updateTab(activeTabId, { language: e.target.value });
                }
              }}
              style={{ backgroundColor: 'transparent', color: 'inherit', border: 'none', outline: 'none', cursor: 'pointer' }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang} style={{ color: '#000' }}>{lang}</option>
              ))}
            </select>
          </span>
          <span className="status-item">length: {activeTab?.content.length || 0}</span>
          <span className="status-item">lines: {activeTab?.content.split('\n').length || 1}</span>
        </div>
        <div className="status-section">
          <span className="status-item">Ln: {lineCount} Col: {colCount}</span>
          <span className="status-item">Windows (CR LF)</span>
          <span className="status-item">{encoding}</span>
          <span className="status-item">INS</span>
        </div>
      </div>
    </div>
  );
}
