import {parseLegacySaveFile} from './legacy_save_file.js';
import {parseLegacyTransferFile,LEGACY_TRANSFER_MAX_BYTES,legacyTransferRecordCount} from './legacy_transfer_file.js';

const message=error=>({migration_not_authorized:'このLINEアカウントでは取り込めません。',migration_source_mismatch:'指定された旧版とは違うファイルです。',legacy_already_claimed:'別のアカウントへ引っ越し済みのセーブが含まれています。',save_limit_reached:'既存のセーブを含めると施設枠を超えます。担当者に確認してください。',migration_file_too_large:'ファイルが大きすぎます。担当者に確認してください。'}[error.message]||'引っ越しファイルを確認してください。取り込みは完了していません。');
function migrationArea(){
  if(!document.getElementById('legacy-file-ui-style')){
    const style=document.createElement('style');style.id='legacy-file-ui-style';
    style.textContent='.account-migration [hidden]{display:none!important}.account-migration{display:grid;gap:10px;min-width:0;padding-top:16px}.migration-name-list{max-height:200px;overflow-y:auto;padding-left:22px;overflow-wrap:anywhere}';
    document.head.appendChild(style);
  }
  const area=document.createElement('section');area.className='account-migration';return area;
}
export function mountLegacyFileImport(container,transport){
  if(!transport.summary.legacyFileMigrationEnabled)return;
  const area=migrationArea();
  const title=document.createElement('h3');title.textContent='旧版のセーブとランキングを引き継ぐ';
  const label=document.createElement('label');label.textContent='引っ越しJSONファイル';
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.id='legacy-import-file';label.appendChild(input);
  const status=document.createElement('p');status.setAttribute('role','status');
  const names=document.createElement('ul');names.className='migration-name-list';
  const submit=document.createElement('button');submit.className='btn';submit.type='button';submit.textContent='この施設のアカウントへ取り込む';submit.hidden=true;
  let file,busy=false,complete=false,generation=0;
  const request=async apply=>{
    const response=await fetch('/api/legacy/import-file',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,apply})});
    const value=await response.json();if(!response.ok)throw Error(value.error);return value;
  };
  input.onchange=async()=>{
    const token=++generation;file=null;submit.hidden=true;names.replaceChildren();
    const selected=input.files[0];if(!selected)return;
    try{
      if(selected.size>LEGACY_TRANSFER_MAX_BYTES)throw Error('migration_file_too_large');
      const text=await selected.text(),raw=JSON.parse(text.replace(/^\uFEFF/,''));
      const parsed=raw.format==='legend-heroes-full-transfer'?parseLegacyTransferFile(raw):parseLegacySaveFile(raw);if(token!==generation)return;file=parsed;
      const preview=await request(false);if(token!==generation)return;
      const raidText=parsed.raidData?` ゲーム進行・所持品・スキン等のセーブ全体と、通常/ハロウィンのランキング${preview.raidRecords}件も対象です。`:'';
      status.textContent=`全${preview.total}人分：新しく${preview.imported}人を取り込み、引っ越し済みの${preview.skipped}人はそのまま残します。${raidText}`;
      for(const name of preview.names){const li=document.createElement('li');li.textContent=name;names.appendChild(li);}
      submit.hidden=false;
    }catch(error){if(token===generation){file=null;status.textContent=message(error);}}
  };
  submit.onclick=async()=>{
    if(complete){location.reload();return;}
    if(busy||!file)return;busy=true;submit.disabled=true;input.disabled=true;
    try{
      await transport.flush();const result=await request(true);
      status.textContent=`${result.imported}人の引っ越しが完了しました。既存の${result.skipped}人は変更していません。${result.raid?` レイド記録: 新規${result.raid.imported}件、更新${result.raid.merged}件、既存維持${result.raid.skipped}件。`:''} 購入は不要です。`;
      input.value='';file=null;complete=true;submit.textContent='セーブ一覧へ進む';
    }catch(error){status.textContent=message(error);input.disabled=false;}
    finally{busy=false;submit.disabled=false;}
  };
  area.append(title,label,status,names,submit);container.appendChild(area);
}
