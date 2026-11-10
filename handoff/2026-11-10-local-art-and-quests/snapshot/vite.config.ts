import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import fs from 'fs';
import {regularPreviewCatalogSource} from './scripts/lib/regular-preview-catalog.mjs';
import {skinPreviewCatalogSource} from './scripts/lib/skin-preview-catalog.mjs';

function skinPreviewPlugin(): Plugin {
  const id = 'virtual:skin-preview-catalog';
  return {name:'skin-preview',apply:'serve',
    resolveId(source){if(source===id)return '\0'+id;},
    load(source){if(source==='\0'+id)return skinPreviewCatalogSource(fs.readFileSync(path.resolve(__dirname,'game.js'),'utf8'));},
  };
}

function regularPrintPreviewPlugin(): Plugin {
  const id='virtual:regular-print-catalog';
  return {name:'regular-print-preview',apply:'serve',
    resolveId(source){if(source===id)return '\0'+id;},
    load(source){if(source==='\0'+id)return regularPreviewCatalogSource(fs.readFileSync(path.resolve(__dirname,'game.js'),'utf8'));},
  };
}

// ビルド完了時にPWA関連ファイルを dist/ にコピーするプラグイン
function pwaCopyPlugin(): Plugin {
  let outputDirectory: string;
  return {
    name: 'pwa-copy-plugin',
    enforce: 'post',
    configResolved(config) { outputDirectory=path.resolve(config.root,config.build.outDir); },
    closeBundle() {
      const pwaFiles = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
      for (const file of pwaFiles) {
        const src = path.resolve(__dirname, file);
        const dest = path.resolve(outputDirectory, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
      console.log('PWA files copied to '+outputDirectory);
    },
  };
}

const isSingleFile = process.env.BUILD_SINGLEFILE === 'true';
const accountApi = process.env.LEGEND_ACCOUNT_API;
if (accountApi && !/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(accountApi)) throw new Error('LEGEND_ACCOUNT_API must be a local test server');

export default defineConfig({
  server: accountApi ? { proxy: { '/api': { target: accountApi } } } : undefined,
  plugins: [
    skinPreviewPlugin(),
    regularPrintPreviewPlugin(),
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
