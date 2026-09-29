import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  handle: any;
  path: string;
}

interface SidebarProps {
  onOpenFile: (handle: any) => void;
}

export default function Sidebar({ onOpenFile }: SidebarProps) {
  const [rootHandle, setRootHandle] = useState<any>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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
      <div className="sidebar-header">
        <span className="sidebar-title">EXPLORER</span>
        <button onClick={openFolder} className="sidebar-action-btn" title="Open Folder">
          <FolderOpen size={14} />
        </button>
      </div>
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
