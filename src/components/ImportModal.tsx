/**
 * T070-T075: 导入模态框 - 显示扫描进度
 */
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { ScanProgress } from './ScanProgress';
import { useScanStore } from '@/stores';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const { t } = useTranslation();
  const { isScanning } = useScanStore();

  const handleCancel = () => {
    if (!isScanning) {
      onClose();
    }
  };

  return (
    <Modal
      title={t('toolbar.import', '导入图片')}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      closable={!isScanning}
      maskClosable={!isScanning}
    >
      <div style={{ padding: '20px 0' }}>
        <ScanProgress />
      </div>
    </Modal>
  );
}
