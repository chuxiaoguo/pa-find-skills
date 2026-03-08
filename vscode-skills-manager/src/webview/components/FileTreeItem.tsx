/**
 * 文件树项组件
 */

import * as React from 'react';
import './FileTree.css';

interface FileTreeItemProps {
  file: any;
  level: number;
  onOpenFile: (filePath: string) => void;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  level,
  onOpenFile,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(level === 0);

  const handleClick = () => {
    if (file.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onOpenFile(file.path);
    }
  };

  const getFileIcon = () => {
    if (file.type === 'directory') {
      return isExpanded ? '📂' : '📁';
    }

    // 根据文件扩展名返回图标
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return '📘';
      case 'js':
      case 'jsx':
        return '📒';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  const style = {
    paddingLeft: `${level * 16 + 8}px`,
  };

  return (
    <div className="file-tree-item">
      <div
        className={`file-tree-row ${file.type === 'directory' ? 'directory' : 'file'}`}
        style={style}
        onClick={handleClick}
      >
        <span className="file-icon">{getFileIcon()}</span>
        <span className="file-name">{file.name}</span>
      </div>

      {file.type === 'directory' && isExpanded && file.children && (
        <div className="file-tree-children">
          {file.children.map((child: any, index: number) => (
            <FileTreeItem
              key={`${child.path}-${index}`}
              file={child}
              level={level + 1}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};
