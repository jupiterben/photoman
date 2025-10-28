// T139: 删除确认对话框
import { useTranslation } from 'react-i18next';
import './DeleteConfirm.css';

interface DeleteConfirmProps {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirm({
  isOpen,
  count,
  onConfirm,
  onCancel,
}: DeleteConfirmProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="delete-confirm-overlay" onClick={handleOverlayClick}>
      <div className="delete-confirm-dialog">
        <div className="dialog-header">
          <div className="warning-icon">⚠️</div>
          <h3>{t('deleteConfirm.title', '确认删除')}</h3>
        </div>

        <div className="dialog-content">
          <p>
            {t(
              'deleteConfirm.message',
              `您将删除 ${count} 张照片。照片将被移至回收站，可以在 30 天内恢复。`
            )}
          </p>
          <p className="warning-text">
            {t(
              'deleteConfirm.warning',
              '注意：照片文件不会被移动或删除，只是从库中移除。'
            )}
          </p>
        </div>

        <div className="dialog-actions">
          <button onClick={onCancel} className="btn-cancel">
            {t('common.cancel', '取消')}
          </button>
          <button onClick={onConfirm} className="btn-delete">
            {t('common.delete', '删除')}
          </button>
        </div>
      </div>
    </div>
  );
}

