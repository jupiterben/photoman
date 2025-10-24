/**
 * Photos page - All photos view
 */
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './Photos.css';

function Photos() {
  const { t } = useTranslation();

  return (
    <div className="photos-page">
      <div className="page-header">
        <h1>{t('pages.photos.title', '所有图片')}</h1>
      </div>

      <Empty
        description={t('pages.photos.noPhotos', '还没有图片，点击导入按钮开始')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" icon={<PlusOutlined />}>
          {t('pages.photos.import', '导入图片')}
        </Button>
      </Empty>
    </div>
  );
}

export default Photos;
