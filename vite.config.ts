import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';

// ビルド完了時にPWA関連ファイルを dist/ にコピーするプラグイン
function pwaCopyPlugin(): Plugin {
  return {
    name: 'pwa-copy-plugin',
    enforce: 'post',
    closeBundle() {
      const pwaFiles = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
      for (const file of pwaFiles) {
        const src = path.resolve(__dirname, file);
        const dest = path.resolve(__dirname, 'dist', file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
      console.log('PWA files copied to dist/ successfully!');
    },
  };
}

const isSingleFile = process.env.BUILD_SINGLEFILE === 'true';

export default defineConfig({
  plugins: [
    ...(isSingleFile ? [
      viteSingleFile({
        useRecommendedBuildConfig: true,
        removeViteModuleLoader: true,
      })
    ] : []),
    pwaCopyPlugin(),
  ],
  build: isSingleFile ? {
    target: 'esnext',
    assetsInlineLimit: 100000000, // 100MBまでBase64インライン化
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  } : {
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
