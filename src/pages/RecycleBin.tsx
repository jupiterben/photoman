// T140: 回收站页面
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecycleStore } from '../stores/recycleStore';
import './RecycleBin.css';

export default function RecycleBin() {
  const { t } = useTranslation();
  const {
    photos,
    stats,
    selectedIds,
    isLoading,
    error,
    fetchPhotos,
    fetchStats,
    selectPhoto,
    unselectPhoto,
    selectAll,
    clearSelection,
    restore,
    permanentlyDelete,
    cleanExpired,
    empty,
  } = useRecycleStore();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'empty' | null>(null);

  useEffect(() => {
    fetchPhotos();
    fetchStats();
  }, [fetchPhotos, fetchStats]);

  const handleRestore = async () => {
    if (selectedIds.length === 0) {
      alert(t('recycle.selectPhotosFirst', '请先选择要恢复的照片'));
      return;
    }
    
    try {
      await restore(selectedIds);
      alert(t('recycle.restoreSuccess', `已恢复 ${selectedIds.length} 张照片`));
    } catch (error) {
      alert(t('recycle.restoreFailed', '恢复失败'));
    }
  };

  const handlePermanentlyDelete = () => {
    if (selectedIds.length === 0) {
      alert(t('recycle.selectPhotosFirst', '请先选择要删除的照片'));
      return;
    }
    
    setConfirmAction('delete');
    setShowConfirmDialog(true);
  };

  const handleEmpty = () => {
    if (photos.length === 0) {
      alert(t('recycle.emptyBin', '回收站已经是空的'));
      return;
    }
    
    setConfirmAction('empty');
    setShowConfirmDialog(true);
  };

  const handleCleanExpired = async () => {
    try {
      await cleanExpired(30);
      alert(t('recycle.cleanSuccess', '已清理过期项目'));
    } catch (error) {
      alert(t('recycle.cleanFailed', '清理失败'));
    }
  };

  const confirmAndExecute = async () => {
    try {
      if (confirmAction === 'delete') {
        await permanentlyDelete(selectedIds);
        alert(t('recycle.deleteSuccess', `已永久删除 ${selectedIds.length} 张照片`));
      } else if (confirmAction === 'empty') {
        await empty();
        alert(t('recycle.emptySuccess', '回收站已清空'));
      }
    } catch (error) {
      alert(t('recycle.actionFailed', '操作失败'));
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return t('recycle.unknown', '未知');
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="recycle-bin">
      <header className="recycle-header">
        <h1>{t('recycle.title', '回收站')}</h1>
        
        <div className="recycle-stats">
          {stats && (
            <>
              <span>{t('recycle.itemCount', '项目')}: {stats.count}</span>
              <span>{t('recycle.totalSize', '总大小')}: {formatFileSize(stats.total_size)}</span>
              {stats.oldest_deleted && (
                <span>
                  {t('recycle.oldest', '最早')}: {formatDate(stats.oldest_deleted)}
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="recycle-toolbar">
        <div className="toolbar-left">
          <button
            onClick={selectAll}
            disabled={photos.length === 0}
            className="btn-secondary"
          >
            {t('recycle.selectAll', '全选')}
          </button>
          <button
            onClick={clearSelection}
            disabled={selectedIds.length === 0}
            className="btn-secondary"
          >
            {t('recycle.clearSelection', '取消选择')}
          </button>
          <span className="selection-count">
            {t('recycle.selected', '已选择')}: {selectedIds.length}
          </span>
        </div>

        <div className="toolbar-right">
          <button
            onClick={handleRestore}
            disabled={selectedIds.length === 0}
            className="btn-primary"
          >
            {t('recycle.restore', '恢复')}
          </button>
          <button
            onClick={handlePermanentlyDelete}
            disabled={selectedIds.length === 0}
            className="btn-danger"
          >
            {t('recycle.permanentlyDelete', '永久删除')}
          </button>
          <button
            onClick={handleCleanExpired}
            className="btn-secondary"
          >
            {t('recycle.cleanExpired', '清理过期')}
          </button>
          <button
            onClick={handleEmpty}
            disabled={photos.length === 0}
            className="btn-danger"
          >
            {t('recycle.empty', '清空回收站')}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading">
          {t('common.loading', '加载中...')}
        </div>
      ) : photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗑️</div>
          <h2>{t('recycle.empty', '回收站为空')}</h2>
          <p>{t('recycle.emptyHint', '已删除的照片会显示在这里')}</p>
        </div>
      ) : (
        <div className="recycle-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`recycle-photo-card ${
                selectedIds.includes(photo.id) ? 'selected' : ''
              }`}
              onClick={() => {
                if (selectedIds.includes(photo.id)) {
                  unselectPhoto(photo.id);
                } else {
                  selectPhoto(photo.id);
                }
              }}
            >
              <div className="photo-thumbnail">
                <img
                  src={`asset://localhost/${photo.file_path}`}
                  alt={photo.file_name}
                  loading="lazy"
                />
              </div>
              <div className="photo-info">
                <div className="photo-name">{photo.file_name}</div>
                {photo.deleted_at && (
                  <div className="deleted-date">
                    {t('recycle.deletedAt', '删除于')}:{' '}
                    {new Date(photo.deleted_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              {selectedIds.includes(photo.id) && (
                <div className="selection-badge">✓</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>
              {confirmAction === 'delete'
                ? t('recycle.confirmDelete', '确认永久删除')
                : t('recycle.confirmEmpty', '确认清空回收站')}
            </h3>
            <p>
              {confirmAction === 'delete'
                ? t(
                    'recycle.confirmDeleteMessage',
                    `您将永久删除 ${selectedIds.length} 张照片，此操作无法撤销。`
                  )
                : t(
                    'recycle.confirmEmptyMessage',
                    '您将永久删除回收站中的所有照片，此操作无法撤销。'
                  )}
            </p>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="btn-secondary"
              >
                {t('common.cancel', '取消')}
              </button>
              <button onClick={confirmAndExecute} className="btn-danger">
                {t('common.confirm', '确认')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

