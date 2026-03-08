/**
 * 文件树组件
 */

import * as React from 'react';
import { FileTreeItem } from './FileTreeItem';
import './FileTree.css';

interface FileTreeProps {
  files: any[];
  onOpenFile: (filePath: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onOpenFile }) => {
  if (!files || files.length === 0) {
    return (
      <div className="file-tree-empty">
        <div className="empty-text">暂无文件</div>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {files.map((file, index) => (
        <FileTreeItem
          key={`${file.path}-${index}`}
          file={file}
          level={0}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
};
