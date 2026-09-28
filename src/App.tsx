import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Save, FolderOpen, FileText, Settings, X } from 'lucide-react';
import './index.css';

export default function App() {
  const [content, setContent] = useState<string>('');
  const [language, setLanguage] = useState('plaintext');
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('Untitled.txt');
  const [lineCount, setLineCount] = useState(1);
  const [colCount, setColCount] = useState(1);
  const encoding = 'UTF-8';
  
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Register cursor position change event
    editor.onDidChangeCursorPosition((e: any) => {
      setLineCount(e.position.lineNumber);
      setColCount(e.position.column);
    });
  };

  const openFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker();
      const file = await handle.getFile();
      const text = await file.text();
      
      setFileHandle(handle);
      setFileName(file.name);
      setContent(text);
      
      // Basic language detection
      if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) setLanguage('javascript');
      else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) setLanguage('typescript');
      else if (file.name.endsWith('.html')) setLanguage('html');
      else if (file.name.endsWith('.css')) setLanguage('css');
      else if (file.name.endsWith('.json')) setLanguage('json');
      else setLanguage('plaintext');
      
    } catch (err) {
      console.log('User cancelled or error:', err);
    }
  };

  const saveFile = async () => {
    try {
      if (!editorRef.current) return;
      
      const currentContent = editorRef.current.getValue();
      let handleToUse = fileHandle;
      
      if (!handleToUse) {
        handleToUse = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] },
          }],
        });
        setFileHandle(handleToUse);
        setFileName(handleToUse.name);
      }
      
      const writable = await handleToUse.createWritable();
      await writable.write(currentContent);
      await writable.close();
      
      alert('File saved successfully!');
    } catch (err) {
      console.error('Error saving file:', err);
    }
  };

  const newFile = () => {
    setContent('');
    setFileHandle(null);
    setFileName('Untitled.txt');
    setLanguage('plaintext');
  };

  return (
    <div className="app-container">
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item" onClick={newFile}>File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">Search</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Encoding</div>
        <div className="menu-item">Language</div>
        <div className="menu-item">Settings</div>
        <div className="menu-item">Tools</div>
        <div className="menu-item">Macro</div>
        <div className="menu-item">Run</div>
        <div className="menu-item">Plugins</div>
        <div className="menu-item">Window</div>
        <div className="menu-item">?</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="toolbar-btn" onClick={newFile} title="New File">
          <FileText size={16} />
        </button>
        <button className="toolbar-btn" onClick={openFile} title="Open File">
          <FolderOpen size={16} />
        </button>
        <button className="toolbar-btn" onClick={saveFile} title="Save File">
          <Save size={16} />
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" title="Close File" onClick={newFile}>
          <X size={16} />
        </button>
        <div className="toolbar-divider"></div>
        <button className="toolbar-btn" title="Settings">
          <Settings size={16} />
        </button>
      </div>

      {/* Tab bar (Mock) */}
      <div style={{ display: 'flex', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <div style={{ padding: '5px 15px', backgroundColor: '#fff', borderRight: '1px solid #ccc', borderTop: '2px solid orange', cursor: 'pointer', fontSize: '12px' }}>
          {fileName}
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        <Editor
          height="100%"
          language={language}
          theme="vs-light"
          value={content}
          onChange={(val) => setContent(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            wordWrap: 'on',
            fontSize: 14,
            fontFamily: "'Consolas', 'Courier New', monospace"
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-section">
          <span className="status-item">{language} type</span>
          <span className="status-item">length: {content.length}</span>
          <span className="status-item">lines: {content.split('\n').length}</span>
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
