// T157: 加载状态组件
import './LoadingState.css';

export interface LoadingStateProps {
  message?: string;
  fullscreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingState({
  message = '加载中...',
  fullscreen = false,
  size = 'medium',
}: LoadingStateProps) {
  const className = `loading-state ${fullscreen ? 'loading-fullscreen' : ''} loading-${size}`;

  return (
    <div className={className}>
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
}

