// 搜索结果页面
import { useEffect } from 'react';
import { Empty, Spin, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSearchStore, useSettingsStore } from '@/stores';
import { PhotoGrid } from '@/components/PhotoGrid';
import './SearchResults.css';

function SearchResults() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { searchResult, isSearching, currentQuery } = useSearchStore();
  const { thumbnailSize } = useSettingsStore();

  useEffect(() => {
    // 如果没有搜索结果，返回主页
    if (!currentQuery && !isSearching) {
      navigate('/');
    }
  }, [currentQuery, isSearching, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isSearching) {
    return (
      <div className="search-results-page">
        <div className="search-results-loading">
          <Spin size="large" />
          <p>{t('search.searching', '搜索中...')}</p>
        </div>
      </div>
    );
  }

  if (!searchResult || searchResult.photos.length === 0) {
    return (
      <div className="search-results-page">
        <div className="page-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            {t('common.back', '返回')}
          </Button>
          <h1>{t('search.results', '搜索结果')}</h1>
          <div className="search-results-count">
            {t('search.noResults', '未找到匹配的照片')}
          </div>
        </div>

        <Empty
          description={t('search.tryOtherKeywords', '请尝试其他搜索关键词或筛选条件')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          {t('common.back', '返回')}
        </Button>
        <h1>{t('search.results', '搜索结果')}</h1>
        <div className="search-results-count">
          {t('search.foundCount', { count: searchResult.total_count }, `找到 ${searchResult.total_count} 张照片`)}
        </div>
      </div>

      <PhotoGrid
        photos={searchResult.photos}
        thumbnailSize={thumbnailSize}
      />

      {searchResult.has_more && (
        <div className="search-results-more">
          <p>{t('search.hasMore', '还有更多结果，请使用更具体的筛选条件')}</p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;



