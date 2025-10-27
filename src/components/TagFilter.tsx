// T110: 标签筛选栏
import { useState, useEffect } from 'react';
import { Space, Radio, Button, Empty } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { TagChip } from './TagChip';
import { getAllTags } from '@/api/tags';
import type { Tag } from '@/api/tags';
import { useTranslation } from 'react-i18next';
import { useTagStore } from '@/stores/tagStore';
import './TagFilter.css';

interface TagFilterProps {
  onFilterChange?: (tagIds: number[], mode: 'any' | 'all') => void;
}

export function TagFilter({ onFilterChange }: TagFilterProps) {
  const { t } = useTranslation();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const { selectedTags, filterMode, selectTag, deselectTag, clearSelection, setFilterMode } =
    useTagStore();

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    // 当选中标签或筛选模式改变时，通知父组件
    const tagIds = Array.from(selectedTags);
    onFilterChange?.(tagIds, filterMode);
  }, [selectedTags, filterMode, onFilterChange]);

  const loadTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags.filter((tag) => tag.usage_count > 0));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleTagClick = (tag: Tag) => {
    if (tag.id) {
      if (selectedTags.has(tag.id)) {
        deselectTag(tag.id);
      } else {
        selectTag(tag.id);
      }
    }
  };

  const handleClear = () => {
    clearSelection();
  };

  const selectedTagObjects = allTags.filter((tag) => tag.id && selectedTags.has(tag.id));

  return (
    <div className="tag-filter">
      <div className="tag-filter-header">
        <Space>
          <FilterOutlined />
          <strong>{t('tags.filterByTags')}</strong>
          {selectedTags.size > 0 && (
            <Button type="link" size="small" icon={<ClearOutlined />} onClick={handleClear}>
              {t('tags.clearFilter')}
            </Button>
          )}
        </Space>

        {selectedTags.size > 1 && (
          <Radio.Group
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            size="small"
          >
            <Radio.Button value="any">{t('tags.matchAny')}</Radio.Button>
            <Radio.Button value="all">{t('tags.matchAll')}</Radio.Button>
          </Radio.Group>
        )}
      </div>

      {selectedTagObjects.length > 0 && (
        <div className="tag-filter-selected">
          <div className="filter-label">{t('tags.activeFilters')}:</div>
          <Space wrap>
            {selectedTagObjects.map((tag) => (
              <TagChip key={tag.id} tag={tag} closable onClose={handleTagClick} />
            ))}
          </Space>
        </div>
      )}

      <div className="tag-filter-available">
        <div className="filter-label">{t('tags.allTags')}:</div>
        {allTags.length > 0 ? (
          <Space wrap>
            {allTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} onClick={handleTagClick} />
            ))}
          </Space>
        ) : (
          <Empty description={t('tags.noTagsAvailable')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
}
