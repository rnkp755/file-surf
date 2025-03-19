
export type FileType = 'file' | 'folder';

export interface FileNode {
  name: string;
  type: FileType;
  content?: string;
  children?: FileNode[];
}

export interface FileMap {
  node: FileNode;
  path: string;
  parentPath: string | null;
}

export interface FileSurfProps {
  files: Map<string, FileMap>;
  height?: string | number;
  width?: string | number;
  theme?: 'dark' | 'light';
}

export interface FileTreeProps {
  files: Map<string, FileMap>;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
  explorerWidth: number;
}

export interface MonacoEditorProps {
  files: Map<string, FileMap>;
  selectedFile: string | null;
  openTabs: string[];
  activeTab: string | null;
  onTabChange: (path: string) => void;
  onTabClose: (path: string) => void;
  highlightedFile: string | null;
}

export interface UseFileSurfReturn {
  files: Map<string, FileMap>;
  addFile: (parentPath: string, newFile: FileNode) => void;
  updateFile: (filePath: string, newContent: string) => void;
  deleteFile: (filePath: string) => void;
}
