// T071: 扫描进度条组件
import { Progress, Card, Statistic, Row, Col } from 'antd';
import { FileImageOutlined, FolderOpenOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useScanStore } from '@/stores';
import { useTranslation } from 'react-i18next';

export function ScanProgress() {
  const { t } = useTranslation();
  const { isScanning, scanProgress, scanResult } = useScanStore();

  if (!isScanning && !scanResult) {
    return null;
  }

  const progress = scanProgress || {
    total_files: 0,
    processed_files: 0,
    found_photos: 0,
    current_path: '',
  };

  const percent =
    progress.total_files > 0
      ? Math.round((progress.processed_files / progress.total_files) * 100)
      : 0;

  return (
    <Card
      title={
        isScanning ? (
          <>
            <FolderOpenOutlined /> {t('scan.inProgress')}
          </>
        ) : (
          <>
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> {t('scan.completed')}
          </>
        )
      }
      style={{ marginBottom: 16 }}
    >
      <Progress percent={percent} status={isScanning ? 'active' : 'success'} />

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic
            title={t('scan.totalFiles')}
            value={progress.total_files}
            prefix={<FileImageOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={t('scan.processedFiles')}
            value={progress.processed_files}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={t('scan.foundPhotos')}
            value={scanResult?.found_photos || progress.found_photos}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
      </Row>

      {isScanning && progress.current_path && (
        <div style={{ marginTop: 16, fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
          {t('scan.currentPath')}: {progress.current_path}
        </div>
      )}

      {scanResult && (
        <div style={{ marginTop: 16 }}>
          <p>
            {t('scan.summary', {
              found: scanResult.found_photos,
              total: scanResult.total_files,
              skipped: scanResult.duplicates_skipped,
            })}
          </p>
        </div>
      )}
    </Card>
  );
}
