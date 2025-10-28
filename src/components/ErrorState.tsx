// T158: 错误提示组件
import { useTranslation } from 'react-i18next';
import './ErrorState.css';

export interface ErrorStateProps {
  error: Error | string | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export default function ErrorState({
  error,
  title,
  onRetry,
  onDismiss,
  showDetails = false,
}: ErrorStateProps) {
  const { t } = useTranslation();

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && 'stack' in error ? error.stack : null;

  return (
    <div className="error-state">
      <div className="error-content">
        <div className="error-icon" role="img" aria-label="Error">
          ⚠️
        </div>
        <h3 className="error-title">
          {title || t('error.title', '出错了')}
        </h3>
        <p className="error-message">{errorMessage}</p>
        
        {showDetails && errorStack && (
          <details className="error-details">
            <summary>{t('error.showDetails', '查看详细信息')}</summary>
            <pre className="error-stack">{errorStack}</pre>
          </details>
        )}
        
        <div className="error-actions">
          {onRetry && (
            <button className="btn-retry" onClick={onRetry}>
              {t('error.retry', '重试')}
            </button>
          )}
          {onDismiss && (
            <button className="btn-dismiss" onClick={onDismiss}>
              {t('error.dismiss', '关闭')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 用于页面级别的错误边界
export function ErrorBoundaryFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="error-boundary">
      <ErrorState
        error={error}
        title={t('error.somethingWentWrong', '应用遇到了一个问题')}
        onRetry={resetError}
        showDetails={true}
      />
    </div>
  );
}

