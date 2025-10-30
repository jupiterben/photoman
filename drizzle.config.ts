import { defineConfig } from 'drizzle-kit';
import { app } from 'electron';
import * as path from 'path';

// 开发环境使用临时数据库路径
const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev
  ? './dev-data/photoman.db'
  : path.join(app?.getPath('userData') || '.', 'photoman.db');

export default defineConfig({
  schema: './electron/services/db-schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
  verbose: true,
  strict: true,
});

