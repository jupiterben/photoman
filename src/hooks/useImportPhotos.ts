/**
 * T070-T075: 导入照片 Hook - 处理文件夹选择和扫描逻辑
 */
import { useState } from 'react';
import { message } from 'antd';
import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { scanFolder, listenScanProgress } from '@/api/scanner';
import { useScanStore } from '@/stores';

export function useImportPhotos() {
  const { t } = useTranslation();
  const [isSelecting, setIsSelecting] = useState(false);
  const { startScan, updateProgress, completeScan, failScan } = useScanStore();

  const startImport = async (onComplete?: () => void) => {
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
        return false;
      }

      const folderPath = typeof selected === 'string' ? selected : selected[0];
      setIsSelecting(false);

      // 开始后台扫描
      startScan();

      // 提示用户扫描已开始
      message.info(t('scan.startedMessage', '后台扫描已开始，您可以继续使用应用'));

      // 监听扫描进度
      const unlisten = await listenScanProgress((progress) => {
        updateProgress(progress);
      });

      // 后台执行扫描（不阻塞 UI）
      scanFolder(folderPath, {
        recursive: true,
        detect_duplicates: true,
      })
        .then((result) => {
          completeScan(result);
          message.success(
            t('scan.successMessage', {
              count: result.found_photos,
            }),
            5 // 显示 5 秒
          );
          onComplete?.();
        })
        .catch((error) => {
          const errorMsg = error instanceof Error ? error.message : String(error);
          failScan(errorMsg);
          message.error(t('scan.errorMessage', { error: errorMsg }));
        })
        .finally(() => {
          unlisten();
        });

      // 立即返回，不等待扫描完成
      return true;
    } catch (error) {
      message.error(t('folder.selectError'));
      console.error('Failed to select folder:', error);
      setIsSelecting(false);
      return false;
    }
  };

  return {
    startImport,
    isSelecting,
  };
}
