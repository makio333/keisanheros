import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {runtimeArtPlugin} from './scripts/lib/runtime-art-plugin.mjs';
export default defineConfig({plugins:[runtimeArtPlugin(fileURLToPath(new URL('./',import.meta.url)))],build:{target:'esnext'}});
