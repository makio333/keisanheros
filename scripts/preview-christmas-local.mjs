import {fileURLToPath} from 'node:url';
process.argv[2]=fileURLToPath(new URL('../',import.meta.url));
await import('./preview-christmas-stage.mjs');
