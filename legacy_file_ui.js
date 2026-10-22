import {buildLegacySaveFile,parseLegacySaveFile,LEGACY_FILE_MAX_BYTES} from './legacy_save_file.js';

const message=error=>({migration_not_authorized:'このLINEアカウントでは取り込めません。',migration_source_mismatch:'指定された旧版とは違うファイルです。',legacy_already_claimed:'別のアカウントへ引っ越し済みのセーブが含まれています。',save_limit_reached:'既存のセーブを含めると施設枠を超えます。担当者に確認してください。',migration_file_too_large:'ファイルが大きすぎます。担当者に確認してください。'}[error.message]||'引っ越しファイルを確認してください。取り込みは完了していません。');
function migrationArea(){
  if(!document.getElementById('legacy-file-ui-style')){
    const style=document.createElement('style');style.id='legacy-file-ui-style';
    style.textContent='.account-migration [hidden]{display:none!important}.account-migration{display:grid;gap:10px;min-width:0;padding-top:16px}.migration-name-list{max-height:200px;overflow-y:auto;padding-left:22px;overflow-wrap:anywhere}';
    document.head.appendChild(style);
  }
  const area=document.createElement('section');area.className='account-migration';return area;
}
export function mountLegacyExport(container,{sourceProject,readSaves}){
  const area=migrationArea();
  const title=document.createElement('h3');title.textContent='新版への引っ越し';
  const prepare=document.createElement('button');prepare.type='button';prepare.className='btn';prepare.textContent='全員分の引っ越しファイルを作る';
  const status=document.createElement('p');status.setAttribute('role','status');
  const names=document.createElement('ul');names.className='migration-name-list';
  const download=document.createElement('button');download.type='button';download.className='btn';download.textContent='JSONファイルを保存する';download.hidden=true;
  let file;
  prepare.onclick=async()=>{
    prepare.disabled=true;download.hidden=true;file=null;names.replaceChildren();
    try{
      file=buildLegacySaveFile(sourceProject,await readSaves());
      status.textContent=file.saves.length+'人分です。名前を確認して保存してください。';
      for(const row of file.saves){const li=document.createElement('li');li.textContent=row.gameState.playerName||'プレイヤー';names.appendChild(li);}
      download.hidden=false;
    }catch(error){status.textContent=message(error);}finally{prepare.disabled=false;}
  };
  download.onclick=()=>{
    if(!file)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(file)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='legend-heroes-move-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const source=document.createElement('p');source.textContent='保存先：'+sourceProject;
  area.append(title,source,prepare,status,names,download);container.appendChild(area);
}

export function mountLegacyFileImport(container,transport){
  if(!transport.summary.legacyFileMigrationEnabled)return;
  const area=migrationArea();
  const title=document.createElement('h3');title.textContent='旧版の全員分を引き継ぐ';
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
      if(selected.size>LEGACY_FILE_MAX_BYTES)throw Error('migration_file_too_large');
      const parsed=parseLegacySaveFile(await selected.text());if(token!==generation)return;file=parsed;
      const preview=await request(false);if(token!==generation)return;
      status.textContent=`全${preview.total}人分：新しく${preview.imported}人を取り込み、引っ越し済みの${preview.skipped}人はそのまま残します。`;
      for(const name of preview.names){const li=document.createElement('li');li.textContent=name;names.appendChild(li);}
      submit.hidden=false;
    }catch(error){if(token===generation){file=null;status.textContent=message(error);}}
  };
  submit.onclick=async()=>{
    if(complete){location.reload();return;}
    if(busy||!file)return;busy=true;submit.disabled=true;input.disabled=true;
    try{
      await transport.flush();const result=await request(true);
      status.textContent=`${result.imported}人の引っ越しが完了しました。既存の${result.skipped}人は変更していません。購入は不要です。`;
      input.value='';file=null;complete=true;submit.textContent='セーブ一覧へ進む';
    }catch(error){status.textContent=message(error);input.disabled=false;}
    finally{busy=false;submit.disabled=false;}
  };
  area.append(title,label,status,names,submit);container.appendChild(area);
}
