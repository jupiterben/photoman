/**
 * Photos page - All photos view
 */
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useImportPhotos } from '@/hooks/useImportPhotos';
import './Photos.css';

function Photos() {
  const { t } = useTranslation();
  const { startImport, isSelecting } = useImportPhotos();

  const handleImportComplete = () => {
    // TODO: Refresh photo list after import
    console.log('Import completed, will refresh photo list');
  };

  const handleImportClick = async () => {
    await startImport(handleImportComplete);
    // 扫描在后台进行，不需要等待
  };

  return (
    <div className="photos-page">
      <div className="page-header">
        <h1>{t('pages.photos.title', '所有图片')}</h1>
      </div>

      <Empty
        description={t('pages.photos.noPhotos', '还没有图片，点击导入按钮开始')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleImportClick}
          loading={isSelecting}
        >
          {t('pages.photos.import', '导入图片')}
        </Button>
      </Empty>

      {/* 后台扫描时不显示模态框，使用非侵入式message提示 */}
    </div>
  );
}

export default Photos;
