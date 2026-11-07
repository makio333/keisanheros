export const LEGACY_TRANSFER_FORMAT='legend-heroes-full-transfer';
export const LEGACY_TRANSFER_MAX_BYTES=20*1024*1024;
const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validId=value=>typeof value==='string'&&value.length>0&&value.length<=1500&&!value.includes('/');
const validateRows=(rows,max=5000)=>{
  if(!Array.isArray(rows)||rows.length>max)throw Error('invalid_migration_file');
  for(const row of rows)if(!isObject(row)||!validId(row.id)||!isObject(row.data))throw Error('invalid_migration_file');
};
export function parseLegacyTransferFile(value){
  const text=typeof value==='string'?value:JSON.stringify(value);
  if(new TextEncoder().encode(text).length>LEGACY_TRANSFER_MAX_BYTES)throw Error('migration_file_too_large');
  const file=JSON.parse(text.replace(/^\uFEFF/,''));
  if(file?.format!==LEGACY_TRANSFER_FORMAT||file.version!==1||!/^[a-z][a-z0-9-]{4,62}$/.test(file.sourceProject)||!Array.isArray(file.saves)||!file.saves.length||file.saves.length>200||!isObject(file.raidData))throw Error('invalid_migration_file');
  const ids=new Set();
  for(const row of file.saves){
    if(!isObject(row)||!validId(row.documentId)||!validId(row.sourceSlotKey)||ids.has(row.documentId)||!isObject(row.gameState)||!isObject(row.gameState.player))throw Error('invalid_migration_file');
    ids.add(row.documentId);
  }
  const raid=file.raidData;
  if(raid.global!==null&&(!isObject(raid.global)||raid.global.id!=='currentBoss'||!isObject(raid.global.data)))throw Error('invalid_migration_file');
  validateRows(raid.history);
  if(!Array.isArray(raid.bossRankings)||raid.bossRankings.length>500)throw Error('invalid_migration_file');
  for(const group of raid.bossRankings){if(!isObject(group)||!/^boss(?:1|_\d{1,8})$/.test(group.bossId))throw Error('invalid_migration_file');validateRows(group.rows);}
  validateRows(raid.raidClaims);validateRows(raid.raidCoinRankClaims);
  for(const key of ['eventRankings','eventClaims','eventFinalClaims']){
    if(!Array.isArray(raid[key])||raid[key].length>100)throw Error('invalid_migration_file');
    for(const group of raid[key]){if(!isObject(group)||!/^halloween_[a-z0-9_]{1,80}$/.test(group.eventId))throw Error('invalid_migration_file');validateRows(group.rows);}
  }
  validateRows(raid.eventFinalResults,100);validateRows(raid.adminGifts);
  return file;
}
export function buildLegacyTransferFile(sourceProject,saves,raidData){
  return parseLegacyTransferFile({format:LEGACY_TRANSFER_FORMAT,version:1,sourceProject,exportedAt:new Date().toISOString(),saves,raidData});
}
export function legacyTransferRecordCount(raid={}){
  const groups=[...(raid.bossRankings||[]),...(raid.eventRankings||[]),...(raid.eventClaims||[]),...(raid.eventFinalClaims||[])];
  return (raid.global?1:0)+(raid.history||[]).length+(raid.raidClaims||[]).length+(raid.raidCoinRankClaims||[]).length+(raid.eventFinalResults||[]).length+(raid.adminGifts||[]).length+groups.reduce((sum,group)=>sum+(group.rows||[]).length,0);
}
