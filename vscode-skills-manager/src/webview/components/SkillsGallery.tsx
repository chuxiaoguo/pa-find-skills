/**
 * 技能总览组件 - 网格卡片布局
 */

import * as React from 'react';
import './SkillsGallery.css';

interface SkillsGalleryProps {
  skills: any[];
  filter: {
    search: string;
    installType: 'all' | 'global' | 'local';
    sourceType: 'all' | 'local' | 'local-zip' | 'pingancoder-api';
  };
  onFilterChange: (filter: any) => void;
  onSelectSkill: (skillId: string) => void;
  onInstall: () => void;
}

export const SkillsGallery: React.FC<SkillsGalleryProps> = ({
  skills,
  filter,
  onFilterChange,
  onSelectSkill,
  onInstall,
}) => {
  // 筛选技能
  const filteredSkills = skills.filter((skill) => {
    // 搜索过滤
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      if (
        !skill.name.toLowerCase().includes(searchLower) &&
        !skill.description.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // 安装类型过滤
    if (filter.installType !== 'all' && skill.installType !== filter.installType) {
      return false;
    }

    // 来源类型过滤
    if (filter.sourceType !== 'all' && skill.sourceType !== filter.sourceType) {
      return false;
    }

    return true;
  });

  // 按安装类型分组
  const globalSkills = filteredSkills.filter((s) => s.installType === 'global');
  const localSkills = filteredSkills.filter((s) => s.installType === 'local');

  return (
    <div className="skills-gallery">
      {/* 顶部工具栏 */}
      <div className="gallery-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索技能..."
          value={filter.search}
          onChange={(e) =>
            onFilterChange({ ...filter, search: (e.target as HTMLInputElement).value })
          }
        />

        <select
          className="filter-select"
          value={filter.installType}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              installType: (e.target as HTMLSelectElement).value as any,
            })
          }
        >
          <option value="all">全部</option>
          <option value="global">全局</option>
          <option value="local">本地</option>
        </select>

        <select
          className="filter-select"
          value={filter.sourceType}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              sourceType: (e.target as HTMLSelectElement).value as any,
            })
          }
        >
          <option value="all">所有来源</option>
          <option value="local">本地目录</option>
          <option value="local-zip">Zip 包</option>
          <option value="pingancoder-api">Pingancoder 市场</option>
        </select>

        <button className="install-button" onClick={onInstall}>
          + 安装技能
        </button>
      </div>

      {/* 技能统计 */}
      <div className="gallery-stats">
        <span>共 {filteredSkills.length} 个技能</span>
        {filter.search && <span> - 搜索: "{filter.search}"</span>}
      </div>

      {/* 全局技能 */}
      {globalSkills.length > 0 && (
        <div className="skill-section">
          <h3 className="section-title">全局技能 ({globalSkills.length})</h3>
          <div className="skills-grid">
            {globalSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onClick={() => onSelectSkill(skill.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 本地技能 */}
      {localSkills.length > 0 && (
        <div className="skill-section">
          <h3 className="section-title">本地技能 ({localSkills.length})</h3>
          <div className="skills-grid">
            {localSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onClick={() => onSelectSkill(skill.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {filteredSkills.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">没有找到技能</div>
          <div className="empty-description">
            {filter.search
              ? '尝试调整搜索关键词'
              : '点击"安装技能"按钮添加新技能'}
          </div>
        </div>
      )}
    </div>
  );
};

// 技能卡片组件
const SkillCard: React.FC<{
  skill: any;
  onClick: () => void;
}> = ({ skill, onClick }) => {
  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'local':
        return '本地目录';
      case 'local-zip':
        return 'Zip';
      case 'pingancoder-api':
        return '市场';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="skill-card" onClick={onClick}>
      <div className="card-header">
        <h3 className="card-title">{skill.name}</h3>
        <div className="card-badges">
          <span className={`badge badge-${skill.sourceType}`}>
            {getSourceTypeLabel(skill.sourceType)}
          </span>
          {skill.isSymlink && <span className="badge badge-symlink">🔗</span>}
        </div>
      </div>

      <p className="card-description">{skill.description}</p>

      <div className="card-footer">
        {skill.version && (
          <span className="card-version">📦 {skill.version}</span>
        )}
        {skill.author && <span className="card-author">👤 {skill.author}</span>}
        <span className="card-date">📅 {formatDate(skill.installedAt)}</span>
      </div>
    </div>
  );
};
