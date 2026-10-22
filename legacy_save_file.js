export const LEGACY_FILE_FORMAT='legend-heroes-legacy-saves';
export const LEGACY_FILE_MAX_BYTES=20*1024*1024;
export function parseLegacySaveFile(value){
  const text=typeof value==='string'?value:JSON.stringify(value);
  if(new TextEncoder().encode(text).length>LEGACY_FILE_MAX_BYTES)throw Error('migration_file_too_large');
  const file=JSON.parse(text);
  if(file?.format!==LEGACY_FILE_FORMAT||file.version!==1||!/^[a-z][a-z0-9-]{4,62}$/.test(file.sourceProject)||!Array.isArray(file.saves)||!file.saves.length||file.saves.length>200)throw Error('invalid_migration_file');
  const ids=new Set();
  for(const row of file.saves){
    if(typeof row.documentId!=='string'||!row.documentId||row.documentId.length>1000||row.documentId.includes('/')||ids.has(row.documentId)||!row.gameState||typeof row.gameState!=='object'||Array.isArray(row.gameState)||!row.gameState.player||typeof row.gameState.player!=='object'||Array.isArray(row.gameState.player))throw Error('invalid_migration_file');
    ids.add(row.documentId);
  }
  return file;
}
export function buildLegacySaveFile(sourceProject,rows){
  return parseLegacySaveFile({format:LEGACY_FILE_FORMAT,version:1,sourceProject,exportedAt:new Date().toISOString(),saves:rows});
}
