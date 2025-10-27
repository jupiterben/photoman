// T102-T103: 标签输入组件（带自动补全）
import { useState, useEffect, useCallback } from 'react';
import { AutoComplete, Input, Tag, Space, Button, message } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { searchTags, getMostUsedTags, createTag } from '@/api/tags';
import type { Tag as TagType } from '@/api/tags';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';

interface TagInputProps {
  value?: TagType[];
  onChange?: (tags: TagType[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value = [], onChange, placeholder, maxTags }: TagInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);

  // T103: 加载初始建议（最常用标签）
  useEffect(() => {
    loadInitialSuggestions();
  }, []);

  const loadInitialSuggestions = async () => {
    try {
      const mostUsed = await getMostUsedTags(10);
      setSuggestions(mostUsed);
    } catch (error) {
      console.error('Failed to load initial suggestions:', error);
    }
  };

  // T103: 搜索标签（带防抖）
  const searchTagsDebounced = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        loadInitialSuggestions();
        return;
      }

      setLoading(true);
      try {
        const results = await searchTags(query, 10);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to search tags:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = (searchValue: string) => {
    setInputValue(searchValue);
    searchTagsDebounced(searchValue);
  };

  const handleSelect = async (tagName: string) => {
    // 检查标签数量限制
    if (maxTags && value.length >= maxTags) {
      message.warning(t('tags.maxTagsReached', { max: maxTags }));
      return;
    }

    // 检查是否已存在
    if (value.some((tag) => tag.name === tagName)) {
      message.info(t('tags.tagAlreadyAdded'));
      setInputValue('');
      return;
    }

    try {
      // 查找现有标签或创建新标签
      let selectedTag = suggestions.find((tag) => tag.name === tagName);

      if (!selectedTag) {
        // 创建新标签
        const newTagId = await createTag(tagName);
        selectedTag = {
          id: newTagId,
          name: tagName,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      onChange?.([...value, selectedTag]);
      setInputValue('');
      message.success(t('tags.tagAdded'));
    } catch (error) {
      message.error(t('tags.addTagError'));
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemove = (tagToRemove: TagType) => {
    onChange?.(value.filter((tag) => tag.id !== tagToRemove.id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleSelect(inputValue.trim());
    }
  };

  const options = suggestions
    .filter((tag) => !value.some((v) => v.id === tag.id))
    .map((tag) => ({
      value: tag.name,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{tag.name}</span>
          <span style={{ color: '#999', fontSize: 12 }}>
            {tag.usage_count > 0 && `${tag.usage_count} ${t('tags.photos')}`}
          </span>
        </div>
      ),
    }));

  return (
    <div>
      <Space wrap style={{ marginBottom: 8 }}>
        {value.map((tag) => (
          <Tag
            key={tag.id}
            closable
            color={tag.color}
            closeIcon={<CloseOutlined />}
            onClose={() => handleRemove(tag)}
          >
            {tag.name}
          </Tag>
        ))}
      </Space>

      <AutoComplete
        value={inputValue}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        placeholder={placeholder || t('tags.inputPlaceholder')}
        style={{ width: '100%' }}
        notFoundContent={
          inputValue.trim() && !loading ? (
            <div style={{ padding: '8px 12px', color: '#999' }}>{t('tags.pressEnterToCreate')}</div>
          ) : null
        }
      >
        <Input
          prefix={<PlusOutlined />}
          onKeyPress={handleKeyPress}
          disabled={maxTags ? value.length >= maxTags : false}
          loading={loading}
        />
      </AutoComplete>
    </div>
  );
}
