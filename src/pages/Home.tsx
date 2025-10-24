/**
 * Home page - Dashboard
 */
import { Card, Row, Col, Statistic, Empty } from 'antd';
import { PictureOutlined, TagsOutlined, FolderOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './Home.css';

function Home() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <h1>{t('pages.home.title', '欢迎使用 PhotoMan')}</h1>
      <p className="subtitle">{t('pages.home.subtitle', '您的本地图片管理助手')}</p>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('pages.home.totalPhotos', '总图片数')}
              value={0}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('pages.home.totalTags', '标签数')}
              value={0}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('pages.home.totalAlbums', '相册数')}
              value={0}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('pages.home.recentPhotos', '最近导入')} className="recent-photos-card">
        <Empty description={t('pages.home.noPhotos', '还没有导入任何图片')} />
      </Card>
    </div>
  );
}

export default Home;
