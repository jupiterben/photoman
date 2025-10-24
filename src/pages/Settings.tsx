/**
 * Settings page
 */
import { Card, Form, Select, InputNumber, TimePicker, Switch, Button, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import './Settings.css';

function Settings() {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();

  const handleSave = async (values: any) => {
    console.log('Settings:', values);
    message.success(t('pages.settings.saved', '设置已保存'));
  };

  return (
    <div className="settings-page">
      <h1>{t('pages.settings.title', '设置')}</h1>

      <Card title={t('pages.settings.appearance', '外观')} className="settings-card">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            theme: 'system',
            language: i18n.language,
          }}
          onFinish={handleSave}
        >
          <Form.Item label={t('pages.settings.theme', '主题')} name="theme">
            <Select>
              <Select.Option value="light">{t('pages.settings.lightTheme', '亮色')}</Select.Option>
              <Select.Option value="dark">{t('pages.settings.darkTheme', '暗色')}</Select.Option>
              <Select.Option value="system">
                {t('pages.settings.systemTheme', '跟随系统')}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={t('pages.settings.language', '语言')} name="language">
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title={t('pages.settings.storage', '存储')} className="settings-card">
        <Form
          layout="vertical"
          initialValues={{
            cacheSize: 5120,
            recycleBinDays: 30,
          }}
        >
          <Form.Item label={t('pages.settings.cacheSize', '缓存大小限制 (MB)')} name="cacheSize">
            <InputNumber min={1024} max={10240} step={512} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label={t('pages.settings.recycleBinDays', '回收站保留天数')}
            name="recycleBinDays"
          >
            <InputNumber min={7} max={90} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Card>

      <Card title={t('pages.settings.backup', '备份')} className="settings-card">
        <Form
          layout="vertical"
          initialValues={{
            autoBackup: true,
            backupTime: dayjs('02:00', 'HH:mm'),
            backupDay: 'sunday',
          }}
        >
          <Form.Item
            label={t('pages.settings.autoBackup', '自动备份')}
            name="autoBackup"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item label={t('pages.settings.backupTime', '备份时间')} name="backupTime">
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label={t('pages.settings.backupDay', '备份日期')} name="backupDay">
            <Select>
              <Select.Option value="monday">{t('pages.settings.monday', '周一')}</Select.Option>
              <Select.Option value="tuesday">{t('pages.settings.tuesday', '周二')}</Select.Option>
              <Select.Option value="wednesday">
                {t('pages.settings.wednesday', '周三')}
              </Select.Option>
              <Select.Option value="thursday">{t('pages.settings.thursday', '周四')}</Select.Option>
              <Select.Option value="friday">{t('pages.settings.friday', '周五')}</Select.Option>
              <Select.Option value="saturday">{t('pages.settings.saturday', '周六')}</Select.Option>
              <Select.Option value="sunday">{t('pages.settings.sunday', '周日')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Space className="settings-actions">
        <Button type="primary" onClick={() => form.submit()}>
          {t('pages.settings.save', '保存设置')}
        </Button>
        <Button onClick={() => form.resetFields()}>{t('pages.settings.reset', '重置')}</Button>
      </Space>
    </div>
  );
}

export default Settings;
