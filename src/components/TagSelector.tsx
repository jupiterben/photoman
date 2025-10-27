// T104: 标签选择器组件
import { useState, useEffect } from 'react';
import { Modal, Space, Button, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getAllTags } from '@/api/tags';
import { TagChip } from './TagChip';
import type { Tag } from '@/api/tags';
import { useTranslation } from 'react-i18next';

interface TagSelectorProps {
  visible: boolean;
  selectedTags?: Tag[];
  onOk: (tags: Tag[]) => void;
  onCancel: () => void;
  title?: string;
  multiple?: boolean;
}

export function TagSelector({
  visible,
  selectedTags = [],
  onOk,
  onCancel,
  title,
  multiple = true,
}: TagSelectorProps) {
  const { t } = useTranslation();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Tag[]>(selectedTags);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTags();
      setSelected(selectedTags);
    }
  }, [visible, selectedTags]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (error) {
      message.error(t('tags.loadError'));
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tag: Tag) => {
    if (multiple) {
      const isSelected = selected.some((t) => t.id === tag.id);
      if (isSelected) {
        setSelected(selected.filter((t) => t.id !== tag.id));
      } else {
        setSelected([...selected, tag]);
      }
    } else {
      setSelected([tag]);
    }
  };

  const isSelected = (tag: Tag) => {
    return selected.some((t) => t.id === tag.id);
  };

  const handleOk = () => {
    onOk(selected);
  };

  return (
    <Modal
      title={title || t('tags.selectTags')}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
      okText={t('common.ok')}
      cancelText={t('common.cancel')}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <strong>{t('tags.selectedTags')}:</strong>
            {selected.length > 0 ? (
              <Space wrap style={{ marginTop: 8 }}>
                {selected.map((tag) => (
                  <TagChip key={tag.id} tag={tag} closable onClose={() => handleToggleTag(tag)} />
                ))}
              </Space>
            ) : (
              <div style={{ color: '#999', marginTop: 8 }}>{t('tags.noTagsSelected')}</div>
            )}
          </div>

          <div>
            <strong>{t('tags.availableTags')}:</strong>
            <Space wrap style={{ marginTop: 8 }}>
              {allTags.map((tag) => (
                <TagChip key={tag.id} tag={tag} onClick={handleToggleTag} />
              ))}
            </Space>
          </div>

          {allTags.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              {t('tags.noTagsAvailable')}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
