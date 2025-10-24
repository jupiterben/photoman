/**
 * Application router configuration
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Home from '@/pages/Home';
import Photos from '@/pages/Photos';
import Settings from '@/pages/Settings';

// Placeholder components for routes that will be implemented later
const Favorites = () => <div>收藏页面 - 待实现</div>;
const Tags = () => <div>标签页面 - 待实现</div>;
const Albums = () => <div>相册页面 - 待实现</div>;
const Trash = () => <div>回收站 - 待实现</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'photos',
        element: <Photos />,
      },
      {
        path: 'favorites',
        element: <Favorites />,
      },
      {
        path: 'tags',
        element: <Tags />,
      },
      {
        path: 'albums',
        element: <Albums />,
      },
      {
        path: 'trash',
        element: <Trash />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
