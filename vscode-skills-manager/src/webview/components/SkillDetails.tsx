/**
 * 技能详情组件
 */

import * as React from 'react';
import { FileTree } from './FileTree';
import './SkillDetails.css';

interface SkillDetailsProps {
  skill: any;
  onBack: () => void;
  onUninstall: (skillId: string) => void;
  onOpenFile: (filePath: string) => void;
}

export const SkillDetails: React.FC<SkillDetailsProps> = ({
  skill,
  onBack,
  onUninstall,
  onOpenFile,
}) => {
  if (!skill) {
    return (
      <div className="skill-details">
        <div className="details-loading">加载中...</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'local':
        return '本地目录';
      case 'local-zip':
        return 'Zip 包';
      case 'pingancoder-api':
        return 'Pingancoder 市场';
      default:
        return type;
    }
  };

  const handleUninstall = () => {
    if ((window as any).confirm(`确定要卸载 "${skill.name}" 吗？`)) {
      onUninstall(skill.id);
    }
  };

  return (
    <div className="skill-details">
      {/* 头部 */}
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>
        <h1 className="details-title">{skill.name}</h1>
        <button className="uninstall-button" onClick={handleUninstall}>
          卸载
        </button>
      </div>

      {/* 概述区域 */}
      <div className="details-section">
        <h2 className="section-heading">📋 概述</h2>
        <p className="details-description">{skill.description}</p>
      </div>

      {/* 元数据区域 */}
      <div className="details-section">
        <h2 className="section-heading">ℹ️ 元数据</h2>
        <div className="metadata-grid">
          {skill.version && (
            <div className="metadata-item">
              <span className="metadata-label">版本:</span>
              <span className="metadata-value">{skill.version}</span>
            </div>
          )}

          {skill.author && (
            <div className="metadata-item">
              <span className="metadata-label">创建者:</span>
              <span className="metadata-value">{skill.author}</span>
            </div>
          )}

          <div className="metadata-item">
            <span className="metadata-label">来源:</span>
            <span className="metadata-value">
              {getSourceTypeLabel(skill.sourceType)}
            </span>
          </div>

          <div className="metadata-item">
            <span className="metadata-label">安装类型:</span>
            <span className="metadata-value">
              {skill.installType === 'global' ? '全局' : '本地'}
            </span>
          </div>

          {skill.isSymlink && (
            <div className="metadata-item">
              <span className="metadata-label">类型:</span>
              <span className="metadata-value">🔗 软链接</span>
            </div>
          )}

          <div className="metadata-item">
            <span className="metadata-label">安装时间:</span>
            <span className="metadata-value">{formatDate(skill.installedAt)}</span>
          </div>

          {skill.updatedAt && skill.updatedAt !== skill.installedAt && (
            <div className="metadata-item">
              <span className="metadata-label">更新时间:</span>
              <span className="metadata-value">{formatDate(skill.updatedAt)}</span>
            </div>
          )}

          <div className="metadata-item">
            <span className="metadata-label">路径:</span>
            <span className="metadata-value metadata-path">{skill.path}</span>
          </div>
        </div>
      </div>

      {/* 文件树区域 */}
      <div className="details-section">
        <h2 className="section-heading">📁 文件结构</h2>
        <FileTree files={skill.files || []} onOpenFile={onOpenFile} />
      </div>

      {/* 额外元数据 */}
      {skill.metadata && Object.keys(skill.metadata).length > 0 && (
        <div className="details-section">
          <h2 className="section-heading">🔧 额外信息</h2>
          <div className="metadata-grid">
            {Object.entries(skill.metadata).map(([key, value]) => (
              <div key={key} className="metadata-item">
                <span className="metadata-label">{key}:</span>
                <span className="metadata-value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
