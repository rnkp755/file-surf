import React, { useEffect, useRef, useState } from 'react';
import { MonacoEditorProps } from './types';
import * as monaco from 'monaco-editor';
import { X } from 'lucide-react';

// Import monaco editor
import * as Monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

// Setup the Monaco loader
loader.config({ monaco });

// Initialize Monaco
loader.init().then(/* monaco is loaded */);

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  files,
  selectedFile,
  openTabs,
  activeTab,
  onTabChange,
  onTabClose,
  highlightedFile
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);
  const [fileModels, setFileModels] = useState<Map<string, Monaco.editor.ITextModel>>(new Map());
  
  // Get file language based on extension
  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    // Map file extensions to Monaco languages
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'sh': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'graphql': 'graphql'
    };
    
    return langMap[ext] || 'plaintext';
  };
  
  // Create or get a Monaco model for a file
  const getOrCreateModel = (path: string, content: string = '') => {
    if (fileModels.has(path)) {
      return fileModels.get(path)!;
    }
    
    // Create a new model
    const file = files.get(path);
    if (!file) return null;
    
    const language = getLanguage(file.node.name);
    const uri = Monaco.Uri.parse(`file:///${path}`);
    
    // Check if model already exists for this URI
    const existingModel = Monaco.editor.getModel(uri);
    if (existingModel) {
      // If model exists, update content if needed
      if (file.node.content !== existingModel.getValue()) {
        existingModel.setValue(file.node.content || '');
      }
      
      // Add to our tracking
      setFileModels(prev => {
        const newModels = new Map(prev);
        newModels.set(path, existingModel);
        return newModels;
      });
      
      return existingModel;
    }
    
    // Create new model if none exists
    try {
      const model = Monaco.editor.createModel(
        file.node.content || content,
        language,
        uri
      );
      
      // Add the model to our tracking map
      setFileModels(prev => {
        const newModels = new Map(prev);
        newModels.set(path, model);
        return newModels;
      });
      
      return model;
    } catch (error) {
      console.error("Error creating model:", error);
      return null;
    }
  };
  
  // Initialize the editor
  useEffect(() => {
    if (monacoEl.current && !editorRef.current) {
      editorRef.current = Monaco.editor.create(monacoEl.current, {
        automaticLayout: true,
        theme: 'vs-dark',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
        lineNumbers: 'on',
        wordWrap: 'on',
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        tabSize: 2,
        readOnly: false,
      });
    }
    
    // Cleanup on unmount
    return () => {
      editorRef.current?.dispose();
    };
  }, []);
  
  // Update editor model when active tab changes
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;
    
    const file = files.get(activeTab);
    if (!file) return;
    
    const model = getOrCreateModel(activeTab, file.node.content || '');
    if (model) {
      editorRef.current.setModel(model);
    }
  }, [activeTab, files]);
  
  // Highlight file content when it changes
  useEffect(() => {
    if (!editorRef.current || !highlightedFile || activeTab !== highlightedFile) return;
    
    // Add a decorations to highlight the entire file content
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const lineCount = model.getLineCount();
    
    // Add highlight decoration
    const decorations = editorRef.current.deltaDecorations([], [
      {
        range: new Monaco.Range(1, 1, lineCount, model.getLineMaxColumn(lineCount)),
        options: {
          isWholeLine: true,
          className: 'highlight-animation',
        }
      }
    ]);
    
    // Remove decoration after animation completes
    const timeout = setTimeout(() => {
      editorRef.current?.deltaDecorations(decorations, []);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [highlightedFile, activeTab]);
  
  // Update models when files change
  useEffect(() => {
    // Update existing models with new content
    for (const [path, file] of files.entries()) {
      if (file.node.type === 'file' && fileModels.has(path)) {
        const model = fileModels.get(path);
        if (model && file.node.content !== model.getValue()) {
          model.setValue(file.node.content || '');
        }
      }
    }
  }, [files, fileModels]);
  
  return (
    <div className="editor-container">
      {/* Tabs */}
      <div className="tabs-container h-[2.6rem] flex items-center ">
        {openTabs.map(tab => {
          const file = files.get(tab);
          if (!file) return null;
          
          return (
            <div 
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              <span className="truncate max-w-[150px]">{file.node.name}</span>
              <button 
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab);
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Editor */}
      <div ref={monacoEl} className="monaco-editor-container" />
    </div>
  );
};

export default MonacoEditor;
