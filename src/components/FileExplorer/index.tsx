
import React, { useState, useEffect, useRef } from 'react';
import { FileSurfProps } from './types';
import FileTree from './FileTree';
import MonacoEditor from './MonacoEditor';

const FileSurf: React.FC<FileSurfProps> = ({ 
  files, 
  height = '100vh',
  width = '100vw',
  theme = 'dark'
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  
  // Handle file selection
  const handleFileSelect = (path: string) => {
    const file = files.get(path);
    
    // Only open files, not folders
    if (file && file.node.type === 'file') {
      setSelectedFile(path);
      
      // Add to open tabs if not already open
      if (!openTabs.includes(path)) {
        setOpenTabs(prev => [...prev, path]);
      }
      
      // Set as active tab
      setActiveTab(path);
    }
  };
  
  // Handle tab changes
  const handleTabChange = (path: string) => {
    setActiveTab(path);
    setSelectedFile(path);
  };
  
  // Handle tab close
  const handleTabClose = (path: string) => {
    setOpenTabs(prev => prev.filter(tab => tab !== path));
    
    // If the active tab is being closed, switch to another tab
    if (activeTab === path) {
      const newTabs = openTabs.filter(tab => tab !== path);
      if (newTabs.length > 0) {
        setActiveTab(newTabs[newTabs.length - 1]);
        setSelectedFile(newTabs[newTabs.length - 1]);
      } else {
        setActiveTab(null);
        setSelectedFile(null);
      }
    }
  };
  
  // Resizing functionality
  const handleMouseDown = () => {
    setIsResizing(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width with limits
      let newWidth = e.clientX;
      if (newWidth < 100) newWidth = 100;
      if (newWidth > 500) newWidth = 500;
      
      setExplorerWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  // Watch for file updates to highlight changes
  useEffect(() => {
    const fileEntries = Array.from(files.entries());
    
    // Get the file paths and their content for comparison
    const fileContents = new Map<string, string>();
    for (const [path, fileMap] of fileEntries) {
      if (fileMap.node.type === 'file') {
        fileContents.set(path, fileMap.node.content || '');
      }
    }
    
    // Setup a watcher on files
    const interval = setInterval(() => {
      for (const [path, fileMap] of fileEntries) {
        if (fileMap.node.type === 'file') {
          const oldContent = fileContents.get(path);
          const newContent = fileMap.node.content || '';
          
          if (oldContent !== newContent) {
            // Update our tracking map
            fileContents.set(path, newContent);
            
            // Highlight the file that changed
            setHighlightedFile(path);
            
            // Add to open tabs if not already open
            if (!openTabs.includes(path)) {
              setOpenTabs(prev => [...prev, path]);
              setActiveTab(path);
            } else {
              // Make it the active tab
              setActiveTab(path);
            }
            
            // Clear highlight after animation
            setTimeout(() => {
              setHighlightedFile(null);
            }, 1500);
            
            break; // Only handle one change at a time
          }
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [files, openTabs]);
  
  return (
    <div 
      className="file-explorer flex "
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: typeof width === 'number' ? `${width}px` : width }}
    >
      {/* File Tree */}
      <div style={{ width: `${explorerWidth}px` }} className="flex-shrink-0">
        <div className="px-4 py-auto h-[2.5rem] flex items-center justify-center font-medium tracking-wider border-b border-explorer-border bg-explorer-background uppercase text-sm">
          Explorer
        </div>
        <FileTree 
          files={files} 
          onFileSelect={handleFileSelect} 
          selectedFile={selectedFile}
          explorerWidth={explorerWidth}
        />
      </div>
      
      {/* Resizer */}
      <div
        ref={resizerRef}
        className="resize-handle cursor-col-resize"
        onMouseDown={handleMouseDown}
      />
      
      {/* Editor Panel */}
      <div className="flex-grow h-full bg-editor-background">
        {activeTab ? (
          <MonacoEditor
            files={files}
            selectedFile={selectedFile}
            openTabs={openTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
            highlightedFile={highlightedFile}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-explorer-foreground">
            <div className="text-center">
              <p className="text-xl font-light">Select a file to view</p>
              <p className="text-sm opacity-50 mt-2">No file is currently open</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileSurf;
