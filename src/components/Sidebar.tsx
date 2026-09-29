import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Search } from 'lucide-react';

interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  handle: any;
  path: string;
}

interface SearchResult {
  handle: any;
  path: string;
  name: string;
}

interface SidebarProps {
  onOpenFile: (handle: any) => void;
}

export default function Sidebar({ onOpenFile }: SidebarProps) {
  const [rootHandle, setRootHandle] = useState<any>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'explorer' | 'search'>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async (dirHandle: any, query: string, pathPrefix: string = '') => {
    let results: SearchResult[] = [];
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          // Check extension for text file before opening
          const ext = entry.name.split('.').pop()?.toLowerCase();
          const textExtensions = ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'cpp', 'py', 'java', 'xml'];
          if (ext && textExtensions.includes(ext)) {
            const file = await entry.getFile();
            // simple check size to avoid huge files freezing UI
            if (file.size < 1024 * 1024) { 
              const text = await file.text();
              if (text.includes(query)) {
                results.push({ handle: entry, path: `${pathPrefix}/${entry.name}`, name: entry.name });
              }
            }
          }
        } else if (entry.kind === 'directory') {
          // ignore node_modules and .git
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            const subResults = await performSearch(entry, query, `${pathPrefix}/${entry.name}`);
            results = results.concat(subResults);
          }
        }
      }
    } catch(e) {}
    return results;
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && rootHandle) {
      setIsSearching(true);
      setSearchResults([]);
      const results = await performSearch(rootHandle, searchQuery.trim(), rootHandle.name);
      setSearchResults(results);
      setIsSearching(false);
    }
  };

  const openFolder = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      setRootHandle(dirHandle);
      
      const entries: FileNode[] = [];
      for await (const entry of dirHandle.values()) {
        entries.push({
          name: entry.name,
          kind: entry.kind,
          handle: entry,
          path: `${dirHandle.name}/${entry.name}`
        });
      }
      entries.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
      });
      setFileTree(entries);
      setExpandedFolders(new Set([dirHandle.name]));
    } catch (err) {
      console.log('User cancelled or error:', err);
    }
  };

  const toggleFolder = (node: FileNode) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(node.path)) {
      newExpanded.delete(node.path);
    } else {
      newExpanded.add(node.path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (nodes: FileNode[], paddingLeft: number = 10) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <div key={node.path} className="tree-node-container">
          <div 
            className="tree-node" 
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => {
              if (node.kind === 'directory') toggleFolder(node);
              else onOpenFile(node.handle);
            }}
          >
            {node.kind === 'directory' ? (
              isExpanded ? <ChevronDown size={14} className="tree-icon" /> : <ChevronRight size={14} className="tree-icon" />
            ) : (
              <span style={{ width: 14, display: 'inline-block' }}></span>
            )}
            
            {node.kind === 'directory' ? (
              isExpanded ? <FolderOpen size={14} className="tree-folder-icon" /> : <Folder size={14} className="tree-folder-icon" />
            ) : (
              <File size={14} className="tree-file-icon" />
            )}
            
            <span className="tree-node-name">{node.name}</span>
          </div>
          
          {node.kind === 'directory' && isExpanded && (
            <FolderChildren dirHandle={node.handle} path={node.path} paddingLeft={paddingLeft + 12} onOpenFile={onOpenFile} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
          )}
        </div>
      );
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="sidebar-title">{mode === 'explorer' ? 'EXPLORER' : 'SEARCH'}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setMode(mode === 'explorer' ? 'search' : 'explorer')} 
            className="sidebar-action-btn" 
            title="Search Workspace"
          >
            <Search size={14} />
          </button>
          <button onClick={openFolder} className="sidebar-action-btn" title="Open Folder">
            <FolderOpen size={14} />
          </button>
        </div>
      </div>
      
      {mode === 'search' && (
        <div style={{ padding: '8px' }}>
          <input 
            type="text" 
            placeholder="Search (Enter to start)" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            style={{ 
              width: '100%', 
              padding: '4px 8px', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)', 
              fontSize: '12px',
              borderRadius: '2px'
            }} 
          />
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            {isSearching && <div>Searching...</div>}
            {!isSearching && searchResults.map((res, i) => (
              <div 
                key={i} 
                className="tree-node" 
                onClick={() => onOpenFile(res.handle)}
                title={res.path}
              >
                <File size={14} className="tree-file-icon" />
                <span className="tree-node-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'explorer' && (
        <div className="sidebar-content">
          {rootHandle ? (
            <div className="tree-root">
              <div className="tree-node root-node" onClick={() => {
                  const newExpanded = new Set(expandedFolders);
                  if (newExpanded.has(rootHandle.name)) newExpanded.delete(rootHandle.name);
                  else newExpanded.add(rootHandle.name);
                  setExpandedFolders(newExpanded);
              }}>
                {expandedFolders.has(rootHandle.name) ? <ChevronDown size={14} className="tree-icon" /> : <ChevronRight size={14} className="tree-icon" />}
                <span className="root-name">{rootHandle.name}</span>
              </div>
              {expandedFolders.has(rootHandle.name) && renderTree(fileTree, 20)}
            </div>
          ) : (
            <div className="sidebar-empty">
              <p>You have not yet opened a folder.</p>
              <button onClick={openFolder} className="open-folder-primary-btn">Open Folder</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FolderChildren({ dirHandle, path, paddingLeft, onOpenFile, expandedFolders, toggleFolder }: any) {
  const [children, setChildren] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const entries: FileNode[] = [];
        for await (const entry of dirHandle.values()) {
          entries.push({
            name: entry.name,
            kind: entry.kind,
            handle: entry,
            path: `${path}/${entry.name}`
          });
        }
        entries.sort((a, b) => {
          if (a.kind === b.kind) return a.name.localeCompare(b.name);
          return a.kind === 'directory' ? -1 : 1;
        });
        if (mounted) {
          setChildren(entries);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [dirHandle, path]);

  if (loading) return <div style={{ paddingLeft: `${paddingLeft + 14}px`, fontSize: 12, color: '#888', padding: '4px 0' }}>Loading...</div>;

  return children.map(node => {
    const isExpanded = expandedFolders.has(node.path);
    return (
      <div key={node.path} className="tree-node-container">
        <div 
          className="tree-node" 
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (node.kind === 'directory') toggleFolder(node);
            else onOpenFile(node.handle);
          }}
        >
          {node.kind === 'directory' ? (
            isExpanded ? <ChevronDown size={14} className="tree-icon" /> : <ChevronRight size={14} className="tree-icon" />
          ) : (
            <span style={{ width: 14, display: 'inline-block', flexShrink: 0 }}></span>
          )}
          
          {node.kind === 'directory' ? (
            isExpanded ? <FolderOpen size={14} className="tree-folder-icon" /> : <Folder size={14} className="tree-folder-icon" />
          ) : (
            <File size={14} className="tree-file-icon" />
          )}
          
          <span className="tree-node-name" title={node.name}>{node.name}</span>
        </div>
        
        {node.kind === 'directory' && isExpanded && (
          <FolderChildren dirHandle={node.handle} path={node.path} paddingLeft={paddingLeft + 12} onOpenFile={onOpenFile} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
        )}
      </div>
    );
  });
}
