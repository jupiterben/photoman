// T123: 搜索栏组件
import { useState, useCallback, useRef, useEffect } from 'react';
import { Input, AutoComplete, Spin, message } from 'antd';
import { SearchOutlined, FilterOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchStore } from '@/stores';
import { searchPhotos, quickSearchPhotos, Photo } from '@/api/search';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

interface SearchBarProps {
  onAdvancedFilterClick?: () => void;
  showAdvancedFilter?: boolean;
}

export function SearchBar({ onAdvancedFilterClick, showAdvancedFilter = true }: SearchBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { setCurrentQuery, setSearchResult, setIsSearching, addSearchHistory } = useSearchStore();

  // 快速搜索自动补全
  const handleSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      setOptions([]);
      return;
    }

    // 防抖
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await quickSearchPhotos(value, 5);
        
        const newOptions = results.map((photo: Photo) => ({
          value: photo.file_name,
          label: (
            <div className="search-option">
              <span className="search-option-name">{photo.file_name}</span>
              <span className="search-option-path">{photo.file_path}</span>
            </div>
          ),
        }));
        
        setOptions(newOptions);
      } catch (error) {
        console.error('Quick search failed:', error);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  // 执行完整搜索
  const handleFullSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      message.warning(t('search.emptyKeyword', '请输入搜索关键词'));
      return;
    }

    try {
      setIsSearching(true);
      const query = { keyword: value, limit: 100, offset: 0 };
      const result = await searchPhotos(query);
      
      setCurrentQuery(query);
      setSearchResult(result);
      addSearchHistory(query, result.total_count);
      
      // 导航到搜索结果页面
      navigate('/search-results');
      
      message.success(
        t('search.foundResults', { count: result.total_count }, `找到 ${result.total_count} 张照片`)
      );
    } catch (error) {
      message.error(t('search.failed', '搜索失败'));
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [t, setIsSearching, setCurrentQuery, setSearchResult, addSearchHistory, navigate]);

  // 清空搜索
  const handleClear = useCallback(() => {
    setKeyword('');
    setOptions([]);
    setCurrentQuery(null);
    setSearchResult(null);
  }, [setCurrentQuery, setSearchResult]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="search-bar">
      <AutoComplete
        value={keyword}
        options={options}
        onSearch={handleSearch}
        onSelect={(value) => {
          setKeyword(value);
          handleFullSearch(value);
        }}
        onChange={setKeyword}
        className="search-bar-input"
        popupClassName="search-bar-dropdown"
        notFoundContent={searching ? <Spin size="small" /> : null}
      >
        <Input
          prefix={<SearchOutlined />}
          suffix={
            keyword && (
              <CloseCircleOutlined
                className="search-bar-clear"
                onClick={handleClear}
              />
            )
          }
          placeholder={t('search.placeholder', '搜索图片...')}
          onPressEnter={() => handleFullSearch(keyword)}
          allowClear
        />
      </AutoComplete>
      
      {showAdvancedFilter && (
        <FilterOutlined
          className="search-bar-filter-icon"
          onClick={onAdvancedFilterClick}
          title={t('search.advancedFilter', '高级筛选')}
        />
      )}
    </div>
  );
}



