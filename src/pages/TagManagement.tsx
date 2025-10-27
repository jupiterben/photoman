// T106: 标签管理页面
import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  ColorPicker,
  Space,
  message,
  Popconfirm,
  Tag as AntTag,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined } from '@ant-design/icons';
import { getAllTags, createTag, updateTag, deleteTag, getTagStats } from '@/api/tags';
import type { Tag, TagStats } from '@/api/tags';
import { useTranslation } from 'react-i18next';
import './TagManagement.css';

export function TagManagement() {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tagsData, statsData] = await Promise.all([getAllTags(), getTagStats()]);
      setTags(tagsData);
      setStats(statsData);
    } catch (error) {
      message.error(t('tags.loadError'));
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      color: tag.color,
    });
    setModalVisible(true);
  };

  const handleDelete = async (tag: Tag) => {
    try {
      await deleteTag(tag.id!);
      message.success(t('tags.deleteSuccess'));
      loadData();
    } catch (error) {
      message.error(t('tags.deleteError'));
      console.error('Failed to delete tag:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const colorValue = values.color
        ? typeof values.color === 'string'
          ? values.color
          : (values.color as Color).toHexString()
        : undefined;

      if (editingTag) {
        // 更新标签
        await updateTag(editingTag.id!, values.name, colorValue);
        message.success(t('tags.updateSuccess'));
      } else {
        // 创建标签
        await createTag(values.name, colorValue);
        message.success(t('tags.createSuccess'));
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(editingTag ? t('tags.updateError') : t('tags.createError'));
      console.error('Failed to save tag:', error);
    }
  };

  const columns = [
    {
      title: t('tags.tagName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Tag) => (
        <AntTag color={record.color || 'default'}>{name}</AntTag>
      ),
    },
    {
      title: t('tags.tagColor'),
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string) =>
        color ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: color,
                borderRadius: 4,
                border: '1px solid #d9d9d9',
              }}
            />
            <span>{color}</span>
          </div>
        ) : (
          <span style={{ color: '#999' }}>{t('common.none')}</span>
        ),
    },
    {
      title: t('tags.usageCount'),
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 120,
      sorter: (a: Tag, b: Tag) => a.usage_count - b.usage_count,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: Tag) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('tags.deleteConfirm')}
            onConfirm={() => handleDelete(record)}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="tag-management">
      <div className="tag-management-header">
        <h2>
          <TagOutlined /> {t('tags.management')}
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('tags.createTag')}
        </Button>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('tags.totalTags')}
                value={stats.total_tags}
                prefix={<TagOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title={t('tags.usedTags')} value={stats.used_tags} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title={t('tags.unusedTags')} value={stats.unused_tags} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title={t('tags.totalAssociations')} value={stats.total_associations} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => t('common.totalItems', { total }),
          }}
        />
      </Card>

      <Modal
        title={editingTag ? t('tags.editTag') : t('tags.createTag')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('tags.tagName')}
            rules={[
              { required: true, message: t('tags.nameRequired') },
              { max: 50, message: t('tags.nameTooLong') },
            ]}
          >
            <Input placeholder={t('tags.namePlaceholder')} />
          </Form.Item>

          <Form.Item name="color" label={t('tags.tagColor')}>
            <ColorPicker showText format="hex" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
