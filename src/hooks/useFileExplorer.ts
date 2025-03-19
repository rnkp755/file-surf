
import { useState, useEffect, useRef } from 'react';
import { FileNode, FileMap, UseFileSurfReturn } from '../components/FileExplorer/types';

/**
 * Custom hook for managing file system operations
 */
export const useFileSurf = (initialFiles: FileNode): UseFileSurfReturn => {
  const [files, setFiles] = useState<Map<string, FileMap>>(new Map());
  const initialized = useRef(false);

  useEffect(() => {
    // Only process the initial files once to prevent infinite loops
    if (initialized.current) return;
    
    // Build file map from the JSON structure
    const fileMap = new Map<string, FileMap>();
    
    const processNode = (node: FileNode, path: string, parentPath: string | null) => {
      // Add current node to the map
      fileMap.set(path, { 
        node: { ...node },
        path,
        parentPath
      });
      
      // Process children if it's a folder
      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => {
          const childPath = `${path}/${child.name}`;
          processNode(child, childPath, path);
        });
      }
    };
    
    // Start processing from the root
    processNode(initialFiles, initialFiles.name, null);
    setFiles(fileMap);
    initialized.current = true;
  }, [initialFiles]);
  
  /**
   * Add a new file or folder to a parent path
   */
  const addFile = (parentPath: string, newFile: FileNode) => {
    setFiles(prevFiles => {
      // Create a new map to avoid mutation
      const newFiles = new Map(prevFiles);
      
      // Check if parent exists and is a folder
      const parent = newFiles.get(parentPath);
      if (!parent || parent.node.type !== 'folder') {
        console.error(`Cannot add to ${parentPath}. Parent doesn't exist or isn't a folder.`);
        return prevFiles;
      }
      
      // Make sure parent has children array
      if (!parent.node.children) {
        parent.node.children = [];
      }
      
      // Add the new file to parent's children
      parent.node.children.push(newFile);
      
      // Add the new file to the map
      const newPath = `${parentPath}/${newFile.name}`;
      newFiles.set(newPath, {
        node: newFile,
        path: newPath,
        parentPath
      });
      
      // If it's a folder with children, process them too
      if (newFile.type === 'folder' && newFile.children) {
        newFile.children.forEach(child => {
          const childPath = `${newPath}/${child.name}`;
          newFiles.set(childPath, {
            node: child,
            path: childPath,
            parentPath: newPath
          });
          
          // Recursively process nested children
          if (child.type === 'folder' && child.children) {
            const processChildren = (node: FileNode, path: string) => {
              node.children?.forEach(grandchild => {
                const grandchildPath = `${path}/${grandchild.name}`;
                newFiles.set(grandchildPath, {
                  node: grandchild,
                  path: grandchildPath,
                  parentPath: path
                });
                
                if (grandchild.type === 'folder' && grandchild.children) {
                  processChildren(grandchild, grandchildPath);
                }
              });
            };
            
            processChildren(child, childPath);
          }
        });
      }
      
      return newFiles;
    });
  };
  
  /**
   * Update a file's content
   */
  const updateFile = (filePath: string, newContent: string) => {
    setFiles(prevFiles => {
      const newFiles = new Map(prevFiles);
      
      const file = newFiles.get(filePath);
      if (!file || file.node.type !== 'file') {
        console.error(`Cannot update ${filePath}. File doesn't exist or isn't a file.`);
        return prevFiles;
      }
      
      // Update the content
      file.node.content = newContent;
      
      return newFiles;
    });
  };
  
  /**
   * Delete a file or folder
   */
  const deleteFile = (filePath: string) => {
    setFiles(prevFiles => {
      const newFiles = new Map(prevFiles);
      
      const file = newFiles.get(filePath);
      if (!file) {
        console.error(`Cannot delete ${filePath}. Path doesn't exist.`);
        return prevFiles;
      }
      
      // Remove the file from the map
      newFiles.delete(filePath);
      
      // Remove the file from its parent's children
      if (file.parentPath) {
        const parent = newFiles.get(file.parentPath);
        if (parent && parent.node.children) {
          parent.node.children = parent.node.children.filter(child => child.name !== file.node.name);
        }
      }
      
      // If it's a folder, remove all children recursively
      if (file.node.type === 'folder') {
        for (const [path] of newFiles) {
          if (path.startsWith(`${filePath}/`)) {
            newFiles.delete(path);
          }
        }
      }
      
      return newFiles;
    });
  };
  
  return { files, addFile, updateFile, deleteFile };
};
