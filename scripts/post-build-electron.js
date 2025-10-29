// 构建后脚本：在 dist-electron 目录创建 package.json
// 这样 Electron 主进程就能正确识别为 CommonJS 模块

const fs = require('fs');
const path = require('path');

const distElectronPath = path.join(__dirname, '..', 'dist-electron');
const packageJsonPath = path.join(distElectronPath, 'package.json');

// 确保目录存在
if (!fs.existsSync(distElectronPath)) {
  fs.mkdirSync(distElectronPath, { recursive: true });
}

// 写入 package.json
fs.writeFileSync(packageJsonPath, JSON.stringify({ type: 'commonjs' }, null, 2));

console.log('✓ Created dist-electron/package.json with type: commonjs');

