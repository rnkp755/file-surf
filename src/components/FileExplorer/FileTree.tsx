
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { FileTreeProps, FileMap, FileNode } from './types';

const FileTree: React.FC<FileTreeProps> = ({ 
  files, 
  onFileSelect, 
  selectedFile,
  explorerWidth
}) => {
  // Keep track of expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['project', 'project/src']));
  
  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  };
  
  // Create a tree structure from the flat map
  const buildTree = () => {
    const rootNodes: FileMap[] = [];
    const nodesByParent = new Map<string | null, FileMap[]>();
    
    // Group nodes by their parent
    for (const fileMap of files.values()) {
      if (!nodesByParent.has(fileMap.parentPath)) {
        nodesByParent.set(fileMap.parentPath, []);
      }
      
      nodesByParent.get(fileMap.parentPath)?.push(fileMap);
    }
    
    // Get root level nodes (with null parent)
    const rootItems = nodesByParent.get(null) || [];
    rootNodes.push(...rootItems);
    
    // Render a node and its children
    const renderNode = (fileMap: FileMap, level: number = 0) => {
      const { node, path } = fileMap;
      const isFolder = node.type === 'folder';
      const isExpanded = isFolder && expandedFolders.has(path);
      const isActive = path === selectedFile;
      const basePadding = level * 12; // Base indentation for the level
      
      // Additional padding for files to align with folder content
      const fileExtraPadding = !isFolder ? 16 : 0; // Additional padding for files
      const paddingLeft = basePadding + (isFolder ? 0 : fileExtraPadding);
      
      return (
        <div key={path} className="overflow-hidden">
          <div 
            className={`file-item truncate ${isActive ? 'active' : ''}`}
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={(e) => {
              if (isFolder) {
                toggleFolder(path, e);
              } else {
                onFileSelect(path);
              }
            }}
          >
            <span className="flex items-center w-full">
              {isFolder && (
                <span onClick={(e) => toggleFolder(path, e)} className="mr-1 cursor-pointer">
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4 file-icon" /> : 
                    <ChevronRight className="h-4 w-4 file-icon" />
                  }
                </span>
              )}
              
              <span className="file-icon">
                {isFolder ? 
                  (isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />) : 
                  <File className="h-4 w-4" />
                }
              </span>
              
              <span className="truncate" style={{ maxWidth: `${explorerWidth - paddingLeft - 50}px` }}>
                {node.name}
              </span>
            </span>
          </div>
          
          {/* Render children if folder is expanded */}
          {isFolder && isExpanded && (
            <div className="transition-all ease-in-out duration-200">
              {(nodesByParent.get(path) || [])
                .sort((a, b) => {
                  // Folders first, then files, then alphabetically
                  if (a.node.type === 'folder' && b.node.type !== 'folder') return -1;
                  if (a.node.type !== 'folder' && b.node.type === 'folder') return 1;
                  return a.node.name.localeCompare(b.node.name);
                })
                .map(child => renderNode(child, level + 1))
              }
            </div>
          )}
        </div>
      );
    };
    
    // Sort root nodes (folders first)
    rootNodes.sort((a, b) => {
      if (a.node.type === 'folder' && b.node.type !== 'folder') return -1;
      if (a.node.type !== 'folder' && b.node.type === 'folder') return 1;
      return a.node.name.localeCompare(b.node.name);
    });
    
    // Render the tree starting from root nodes
    return rootNodes.map(node => renderNode(node));
  };
  
  return (
    <div className="file-tree scrollbar-none select-none" style={{ width: `${explorerWidth}px` }}>
      {buildTree()}
    </div>
  );
};

export default FileTree;
