// T070: 文件夹选择对话框
import { useState } from 'react';
import { Button, message, Space } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { scanFolder, listenScanProgress } from '@/api/scanner';
import { useScanStore } from '@/stores';

interface FolderPickerProps {
  onScanComplete?: () => void;
}

export function FolderPicker({ onScanComplete }: FolderPickerProps) {
  const { t } = useTranslation();
  const [isSelecting, setIsSelecting] = useState(false);
  const { startScan, updateProgress, completeScan, failScan } = useScanStore();

  const handleSelectFolder = async () => {
    try {
      setIsSelecting(true);

      // 打开文件夹选择对话框
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('folder.selectTitle'),
      });

      if (!selected) {
        setIsSelecting(false);
        return;
      }

      const folderPath = typeof selected === 'string' ? selected : selected[0];

      // 开始扫描
      startScan();

      // 监听扫描进度
      const unlisten = await listenScanProgress((progress) => {
        updateProgress(progress);
      });

      try {
        // 调用扫描命令
        const result = await scanFolder(folderPath, {
          recursive: true,
          detect_duplicates: true,
        });

        completeScan(result);
        message.success(
          t('scan.successMessage', {
            count: result.found_photos,
          })
        );

        onScanComplete?.();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        failScan(errorMsg);
        message.error(t('scan.errorMessage', { error: errorMsg }));
      } finally {
        unlisten();
      }
    } catch (error) {
      message.error(t('folder.selectError'));
      console.error('Failed to select folder:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Space>
      <Button
        type="primary"
        icon={<FolderOpenOutlined />}
        onClick={handleSelectFolder}
        loading={isSelecting}
        size="large"
      >
        {t('folder.selectButton')}
      </Button>
    </Space>
  );
}
