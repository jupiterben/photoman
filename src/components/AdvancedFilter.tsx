// T125: 高级筛选面板
import { useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Radio,
  Checkbox,
  Button,
  Space,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchQuery, searchPhotos } from '@/api/search';
import { useSearchStore, useTagStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './AdvancedFilter.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdvancedFilterProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedFilter({ open, onClose }: AdvancedFilterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [searching, setSearching] = useState(false);
  
  const { setCurrentQuery, setSearchResult, setIsSearching, addSearchHistory, addSmartAlbum } =
    useSearchStore();
  const { tags } = useTagStore();

  // 执行搜索
  const handleSearch = useCallback(async () => {
    try {
      const values = await form.validateFields();
      
      // 构建查询参数
      const query: SearchQuery = {
        keyword: values.keyword || undefined,
        tag_ids: values.tag_ids?.length > 0 ? values.tag_ids : undefined,
        tag_mode: values.tag_mode || undefined,
        date_from: values.date_range?.[0]
          ? dayjs(values.date_range[0]).valueOf()
          : undefined,
        date_to: values.date_range?.[1]
          ? dayjs(values.date_range[1]).valueOf()
          : undefined,
        size_min: values.size_min ? values.size_min * 1024 * 1024 : undefined, // MB to bytes
        size_max: values.size_max ? values.size_max * 1024 * 1024 : undefined,
        formats: values.formats?.length > 0 ? values.formats : undefined,
        width_min: values.width_min || undefined,
        width_max: values.width_max || undefined,
        height_min: values.height_min || undefined,
        height_max: values.height_max || undefined,
        is_favorite: values.is_favorite || undefined,
        sort_by: values.sort_by || 'taken_at',
        sort_order: values.sort_order || 'desc',
        limit: 100,
        offset: 0,
      };

      setSearching(true);
      setIsSearching(true);
      
      const result = await searchPhotos(query);
      
      setCurrentQuery(query);
      setSearchResult(result);
      addSearchHistory(query, result.total_count);
      
      // 导航到搜索结果页面
      navigate('/search-results');
      
      message.success(
        t('search.foundResults', { count: result.total_count }, `找到 ${result.total_count} 张照片`)
      );
      
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message) {
        // 表单验证错误，不显示消息
        return;
      }
      message.error(t('search.failed', '搜索失败'));
      console.error('Advanced search failed:', error);
    } finally {
      setSearching(false);
      setIsSearching(false);
    }
  }, [
    form,
    t,
    setIsSearching,
    setCurrentQuery,
    setSearchResult,
    addSearchHistory,
    navigate,
    onClose,
  ]);

  // 保存为智能相册
  const handleSaveAsSmartAlbum = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const albumName = values.album_name;
      
      if (!albumName) {
        message.warning(t('search.enterAlbumName', '请输入相册名称'));
        return;
      }

      // 构建查询参数（同搜索）
      const query: SearchQuery = {
        keyword: values.keyword || undefined,
        tag_ids: values.tag_ids?.length > 0 ? values.tag_ids : undefined,
        tag_mode: values.tag_mode || undefined,
        date_from: values.date_range?.[0]
          ? dayjs(values.date_range[0]).valueOf()
          : undefined,
        date_to: values.date_range?.[1]
          ? dayjs(values.date_range[1]).valueOf()
          : undefined,
        size_min: values.size_min ? values.size_min * 1024 * 1024 : undefined,
        size_max: values.size_max ? values.size_max * 1024 * 1024 : undefined,
        formats: values.formats?.length > 0 ? values.formats : undefined,
        width_min: values.width_min || undefined,
        width_max: values.width_max || undefined,
        height_min: values.height_min || undefined,
        height_max: values.height_max || undefined,
        is_favorite: values.is_favorite || undefined,
        sort_by: values.sort_by || 'taken_at',
        sort_order: values.sort_order || 'desc',
      };

      addSmartAlbum(albumName, query);
      message.success(t('search.smartAlbumSaved', '智能相册已保存'));
      form.resetFields(['album_name']);
    } catch (error) {
      console.error('Failed to save smart album:', error);
    }
  }, [form, t, addSmartAlbum]);

  // 重置表单
  const handleReset = useCallback(() => {
    form.resetFields();
  }, [form]);

  return (
    <Modal
      title={t('search.advancedFilter', '高级筛选')}
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={handleReset}>{t('common.reset', '重置')}</Button>
          <Button onClick={handleSaveAsSmartAlbum}>
            {t('search.saveAsSmartAlbum', '保存为智能相册')}
          </Button>
          <Button type="primary" loading={searching} onClick={handleSearch}>
            {t('common.search', '搜索')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          tag_mode: 'any',
          sort_by: 'taken_at',
          sort_order: 'desc',
        }}
      >
        {/* 关键词 */}
        <Form.Item
          label={t('search.keyword', '关键词')}
          name="keyword"
        >
          <Input placeholder={t('search.keywordPlaceholder', '搜索文件名、标题、描述...')} />
        </Form.Item>

        {/* 标签筛选 */}
        <Form.Item label={t('search.tags', '标签')}>
          <Space.Compact block>
            <Form.Item name="tag_mode" noStyle>
              <Select style={{ width: 100 }}>
                <Option value="any">{t('search.anyTag', '任一标签')}</Option>
                <Option value="all">{t('search.allTags', '所有标签')}</Option>
              </Select>
            </Form.Item>
            <Form.Item name="tag_ids" noStyle>
              <Select
                mode="multiple"
                placeholder={t('search.selectTags', '选择标签')}
                style={{ flex: 1 }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={tags.map((tag) => ({
                  label: tag.name,
                  value: tag.id,
                }))}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        {/* 日期范围 */}
        <Form.Item
          label={t('search.dateRange', '拍摄日期')}
          name="date_range"
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* 文件大小 */}
        <Form.Item label={t('search.fileSize', '文件大小 (MB)')}>
          <Space.Compact block>
            <Form.Item name="size_min" noStyle>
              <InputNumber
                placeholder={t('common.min', '最小')}
                min={0}
                style={{ width: '50%' }}
              />
            </Form.Item>
            <Form.Item name="size_max" noStyle>
              <InputNumber
                placeholder={t('common.max', '最大')}
                min={0}
                style={{ width: '50%' }}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        {/* 图片尺寸 */}
        <Form.Item label={t('search.imageDimensions', '图片尺寸 (像素)')}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space.Compact block>
              <Input
                placeholder={t('search.width', '宽度')}
                disabled
                style={{ width: 80 }}
              />
              <Form.Item name="width_min" noStyle>
                <InputNumber
                  placeholder={t('common.min', '最小')}
                  min={0}
                  style={{ width: 'calc(50% - 40px)' }}
                />
              </Form.Item>
              <Form.Item name="width_max" noStyle>
                <InputNumber
                  placeholder={t('common.max', '最大')}
                  min={0}
                  style={{ width: 'calc(50% - 40px)' }}
                />
              </Form.Item>
            </Space.Compact>
            <Space.Compact block>
              <Input
                placeholder={t('search.height', '高度')}
                disabled
                style={{ width: 80 }}
              />
              <Form.Item name="height_min" noStyle>
                <InputNumber
                  placeholder={t('common.min', '最小')}
                  min={0}
                  style={{ width: 'calc(50% - 40px)' }}
                />
              </Form.Item>
              <Form.Item name="height_max" noStyle>
                <InputNumber
                  placeholder={t('common.max', '最大')}
                  min={0}
                  style={{ width: 'calc(50% - 40px)' }}
                />
              </Form.Item>
            </Space.Compact>
          </Space>
        </Form.Item>

        {/* 文件格式 */}
        <Form.Item
          label={t('search.formats', '文件格式')}
          name="formats"
        >
          <Checkbox.Group
            options={[
              { label: 'JPG/JPEG', value: 'jpg' },
              { label: 'PNG', value: 'png' },
              { label: 'WebP', value: 'webp' },
              { label: 'GIF', value: 'gif' },
              { label: 'BMP', value: 'bmp' },
            ]}
          />
        </Form.Item>

        {/* 收藏状态 */}
        <Form.Item
          label={t('search.favorite', '收藏状态')}
          name="is_favorite"
        >
          <Radio.Group>
            <Radio value={undefined}>{t('common.all', '全部')}</Radio>
            <Radio value={true}>{t('common.favoriteOnly', '仅收藏')}</Radio>
            <Radio value={false}>{t('common.notFavorite', '未收藏')}</Radio>
          </Radio.Group>
        </Form.Item>

        {/* 排序 */}
        <Form.Item label={t('search.sortBy', '排序方式')}>
          <Space.Compact block>
            <Form.Item name="sort_by" noStyle>
              <Select style={{ width: '60%' }}>
                <Option value="taken_at">{t('search.sortByDate', '拍摄日期')}</Option>
                <Option value="file_name">{t('search.sortByName', '文件名')}</Option>
                <Option value="file_size">{t('search.sortBySize', '文件大小')}</Option>
                <Option value="width">{t('search.sortByWidth', '宽度')}</Option>
                <Option value="height">{t('search.sortByHeight', '高度')}</Option>
                <Option value="rating">{t('search.sortByRating', '评分')}</Option>
              </Select>
            </Form.Item>
            <Form.Item name="sort_order" noStyle>
              <Select style={{ width: '40%' }}>
                <Option value="desc">{t('common.descending', '降序')}</Option>
                <Option value="asc">{t('common.ascending', '升序')}</Option>
              </Select>
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        {/* 智能相册名称 */}
        <Form.Item
          label={t('search.smartAlbumName', '智能相册名称')}
          name="album_name"
        >
          <Input placeholder={t('search.smartAlbumNamePlaceholder', '保存此筛选条件为智能相册')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}





