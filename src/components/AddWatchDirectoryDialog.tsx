// Add watch directory dialog
// T195: 实现添加监控目录对话框

import React, { useState } from 'react';
import { Modal, Form, Input, Switch, Button, message } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';

interface AddWatchDirectoryDialogProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (path: string, recursive: boolean) => Promise<void>;
}

export const AddWatchDirectoryDialog: React.FC<AddWatchDirectoryDialogProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [directoryPath, setDirectoryPath] = useState('');

  const handleSelectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('watcher.dialog.selectDirectory', '选择要监控的目录'),
      });

      if (selected) {
        setDirectoryPath(selected as string);
        form.setFieldsValue({ directoryPath: selected });
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      message.error(t('watcher.dialog.selectError', '选择目录失败'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await onAdd(values.directoryPath, values.recursive ?? true);

      message.success(t('watcher.dialog.addSuccess', '添加监控目录成功'));
      form.resetFields();
      setDirectoryPath('');
      onClose();
    } catch (error) {
      console.error('添加监控目录失败:', error);
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDirectoryPath('');
    onClose();
  };

  return (
    <Modal
      title={t('watcher.dialog.title', '添加监控目录')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText={t('watcher.dialog.add', '添加')}
      cancelText={t('common.cancel', '取消')}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ recursive: true }}
      >
        <Form.Item
          label={t('watcher.dialog.directoryPath', '目录路径')}
          name="directoryPath"
          rules={[
            {
              required: true,
              message: t('watcher.dialog.pathRequired', '请选择目录'),
            },
          ]}
        >
          <Input
            placeholder={t(
              'watcher.dialog.pathPlaceholder',
              '点击右侧按钮选择目录'
            )}
            value={directoryPath}
            readOnly
            suffix={
              <Button
                type="link"
                icon={<FolderOpenOutlined />}
                onClick={handleSelectDirectory}
              >
                {t('watcher.dialog.browse', '浏览')}
              </Button>
            }
          />
        </Form.Item>

        <Form.Item
          label={t('watcher.dialog.recursive', '递归监控')}
          name="recursive"
          valuePropName="checked"
          tooltip={t(
            'watcher.dialog.recursiveTooltip',
            '是否监控子目录中的图片'
          )}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

