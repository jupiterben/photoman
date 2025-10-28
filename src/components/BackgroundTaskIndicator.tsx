/**
 * 后台任务指示器 - 非侵入式显示扫描进度
 */
import { useScanStore } from '@/stores';
import { Progress, Card } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './BackgroundTaskIndicator.css';

export function BackgroundTaskIndicator() {
  const { t } = useTranslation();
  const { isScanning, scanProgress } = useScanStore();

  if (!isScanning || !scanProgress) {
    return null;
  }

  const progress = scanProgress;
  const percent =
    progress.total_files > 0
      ? Math.round((progress.processed_files / progress.total_files) * 100)
      : 0;

  return (
    <div className="background-task-indicator">
      <Card
        size="small"
        className="task-card"
        title={
          <span>
            <SyncOutlined spin style={{ marginRight: 8 }} />
            {t('scan.inProgress')}
          </span>
        }
      >
        <div className="task-content">
          <Progress
            percent={percent}
            size="small"
            status="active"
            showInfo={false}
          />
          <div className="task-stats">
            <span>
              {progress.processed_files} / {progress.total_files}
            </span>
            <span className="found-photos">
              {t('scan.foundPhotos')}: {progress.found_photos}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}





