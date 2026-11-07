import {LEGACY_FILE_MAX_BYTES,parseLegacySaveFile} from './legacy_save_file.js';
import {LEGACY_TRANSFER_MAX_BYTES,parseLegacyTransferFile} from './legacy_transfer_file.js';

const API='/__single-save-local/api';
const $=id=>document.getElementById(id);
const fileInput=$('save-file'),fileStatus=$('file-status'),childrenSection=$('children-section'),childrenList=$('children-list');
const previewSection=$('preview-section'),dialog=$('confirm-dialog');
let sourceFile=null,selectedPayload=null,activePreview=null,busy=false,generation=0,completed=false;

async function request(path,body){
  const response=await fetch(API+path,{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  let value;try{value=await response.json();}catch{throw Error('migration_unavailable');}
  if(!response.ok)throw Error(value.error||'migration_unavailable');
  return value;
}
function showError(error){
  return ({migration_file_too_large:'ファイルが大きすぎます。元のJSONは変更していません。',invalid_migration_file:'旧セーブJSONの形式を確認できませんでした。元のJSONは変更していません。',invalid_single_save_payload:'選択内容を確認できませんでした。もう一度ファイルを選んでください。',migration_source_mismatch:'対応していない保存元です。',authentication_required:'ローカル確認セッションがありません。画面を開き直してください。',legacy_already_claimed:'この移行元は別の保存先で使われています。移行を停止しました。',legacy_save_id_collision:'同じ移行IDのセーブがすでにあります。上書きしていません。',legacy_source_conflict:'同じ移行元IDで以前と異なる内容が確認されました。上書きしていません。',save_limit_reached:'移行先の空き枠がありません。既存セーブは変更していません。',purchase_required:'移行先の保存枠が設定されていません。',migration_not_authorized:'移行先の担当者認可がありません。書き込みは行っていません。',legacy_ownership_unverified:'移行元の正当性を確認できません。確定しませんでした。',source_proof_not_configured:'移行元のサーバー証明が未接続のため確定できません。',preview_expired:'プレビューの有効期限が切れました。もう一度選び直してください。',preview_not_committable:'このプレビューは確定できません。保存枠と衝突状態を確認してください。',preview_not_found:'プレビューが見つかりません。もう一度選び直してください。',invalid_confirmation:'確定内容を確認できませんでした。'}[error?.message]||'ローカル確認を完了できませんでした。元のJSONは変更していません。');
}
function setChildPreview(child){
  const root=$('child-preview');root.replaceChildren();
  const facts=[['名前',child.playerName],['レベル',child.level??'—'],['所持金',child.gold??'—'],['装備数',child.equipmentCount],['クリア数',child.clearedStages]];
  for(const [label,value] of facts){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value);root.append(dt,dd);}
}
function setDestination(destination){
  $('destination-label').textContent=destination.label;
  $('slot-count').textContent=`${destination.used} / ${destination.limit} 枠を使用中（空き ${destination.free}）`;
  $('slot-progress').max=Math.max(1,destination.limit);$('slot-progress').value=Math.min(destination.used,destination.limit);
  $('capacity-note').textContent=destination.free>0?'合成テスト移行先に空き枠があります。':'合成テスト移行先に空き枠がありません。';
}
async function dropPreview(){
  const previous=activePreview;activePreview=null;
  if(previous)await request('/cancel',{previewId:previous.previewId}).catch(()=>{});
}
function clearSelected({keepChildren=true}={}){
  selectedPayload=null;completed=false;previewSection.hidden=true;$('continue-confirm').disabled=true;$('cancel-selection').disabled=false;$('confirm-import').disabled=true;$('confirm-single').checked=false;
  if(!keepChildren)childrenList.replaceChildren();
  for(const button of childrenList.querySelectorAll('.child-choice'))button.setAttribute('aria-pressed','false');
}
function displayRows(parsed){
  sourceFile=parsed;childrenList.replaceChildren();
  for(const row of parsed.saves){
    const button=document.createElement('button');button.type='button';button.className='child-choice';button.setAttribute('role','listitem');button.setAttribute('aria-pressed','false');
    button.dataset.documentId=row.documentId;
    const name=document.createElement('span'),level=document.createElement('small');
    name.textContent=row.gameState.playerName||row.gameState.player?.name||'プレイヤー';
    level.textContent=`Lv.${row.gameState.player?.lvl||row.gameState.player?.level||1}`;
    button.append(name,level);childrenList.appendChild(button);
  }
  $('file-summary').textContent=`保存元 ${parsed.sourceProject} / ${parsed.saves.length}人分。全員分の内容はこのブラウザー内に保持し、選択後は1人分だけをローカルAPIへ送ります。`;
  childrenSection.hidden=false;
}
async function chooseChild(documentId){
  if(busy||!sourceFile)return;
  const token=++generation;await dropPreview();if(token!==generation)return;clearSelected();
  const row=sourceFile.saves.find(candidate=>candidate.documentId===documentId);if(!row)return;
  selectedPayload={sourceProject:sourceFile.sourceProject,documentId:row.documentId,gameState:structuredClone(row.gameState)};
  for(const button of childrenList.querySelectorAll('.child-choice'))button.setAttribute('aria-pressed',button.dataset.documentId===documentId?'true':'false');
  fileStatus.textContent='選んだ1人分だけをローカルAPIで確認しています…';
  try{
    const result=await request('/preview',selectedPayload);if(token!==generation){await request('/cancel',{previewId:result.previewId}).catch(()=>{});return;}
    activePreview=result;setChildPreview(result.child);setDestination(result.destination);previewSection.hidden=false;
    const integrity=$('integrity-note');integrity.classList.toggle('ready',result.canCommit===true);
    integrity.textContent=result.canCommit?'合成fixtureの移行元証明・担当者認可が設定されています。これはテスト用です。':'移行元証明または担当者認可が未接続のため、確定は停止しています。ファイルを選んだことや本人確認だけでは所有権を証明しません。';
    $('preview-status').textContent=result.state==='imported'?'この合成移行先にはすでに取り込み済みです。進行を上書きしません。':result.reason==='save_limit_reached'?'移行先の空き枠がありません。既存のセーブは変更しません。':result.reason==='purchase_required'?'移行先に保存枠がありません。既存セーブは変更しません。':result.reason==='legacy_already_claimed'?'この移行元は別の保存先で使われています。':result.reason==='legacy_source_conflict'||result.reason==='legacy_save_id_collision'?'同じ移行元IDまたは保存IDに内容の衝突があります。上書きしません。':result.reason==='legacy_transfer_pending_for_other_account'?'この移行元は別の保存先で引っ越し処理中です。確定しません。':result.reason==='transfer_pending'?'この移行元は引っ越し処理中です。状態を確認してください。':result.reason==='source_proof_and_operator_authorization_not_configured'?'プレビューのみです。実ファイルの確定にはサーバー側の移行元証明と担当者認可が必要です。':'選んだ1人分と移行先の枠を確認してください。';
    $('continue-confirm').disabled=!result.canCommit;
    fileStatus.textContent='プレビュー完了。選んだ1人分以外はAPIへ送信していません。';
  }catch(error){if(token===generation){fileStatus.textContent=showError(error);clearSelected();}}
}

fileInput.addEventListener('change',async()=>{
  const token=++generation;await dropPreview();if(token!==generation)return;clearSelected({keepChildren:false});sourceFile=null;childrenSection.hidden=true;
  const file=fileInput.files?.[0];if(!file){fileStatus.textContent='JSONファイルを選択してください。';return;}
  if(file.size>LEGACY_TRANSFER_MAX_BYTES){fileStatus.textContent=showError(Error('migration_file_too_large'));fileInput.value='';return;}
  fileStatus.textContent='ファイルをブラウザー内で確認しています…';
  try{
    const text=await file.text();if(token!==generation)return;
    const raw=JSON.parse(text.replace(/^\uFEFF/,''));
    const limit=raw?.format==='legend-heroes-full-transfer'?LEGACY_TRANSFER_MAX_BYTES:LEGACY_FILE_MAX_BYTES;
    if(file.size>limit)throw Error('migration_file_too_large');
    const parsed=raw?.format==='legend-heroes-full-transfer'?parseLegacyTransferFile(raw):parseLegacySaveFile(raw);
    if(token!==generation)return;displayRows(parsed);fileStatus.textContent='JSONを確認しました。引っ越す人を1人選んでください。';
  }catch(error){if(token===generation){sourceFile=null;fileStatus.textContent=showError(error);fileInput.value='';}}
});

childrenList.addEventListener('click',event=>{
  const button=event.target.closest('.child-choice');if(button)chooseChild(button.dataset.documentId);
});
$('cancel-selection').addEventListener('click',async()=>{
  ++generation;await dropPreview();clearSelected();fileStatus.textContent='選択を取り消しました。元のJSONは変更していません。';
});
$('continue-confirm').addEventListener('click',()=>{
  if(!activePreview||!activePreview.canCommit||completed)return;
  const child=activePreview.child;$('confirm-summary').textContent=`${child.playerName}（Lv.${child.level??'—'}）を「${activePreview.destination.label}」へ1人分だけ追加します。現在 ${activePreview.destination.used}/${activePreview.destination.limit} 枠を使用しています。`;
  $('confirm-single').checked=false;$('confirm-import').disabled=true;dialog.showModal();
});
$('confirm-single').addEventListener('change',()=>{$('confirm-import').disabled=!$('confirm-single').checked||busy;});
$('cancel-confirm').addEventListener('click',()=>dialog.close('cancel'));
dialog.addEventListener('close',async()=>{
  if(dialog.returnValue==='committed'||!activePreview)return;
  const token=++generation,previous=activePreview;activePreview=null;$('continue-confirm').disabled=true;
  if(previous)await request('/cancel',{previewId:previous.previewId}).catch(()=>{});
  if(token===generation)$('preview-status').textContent='確認画面を閉じたためプレビューを破棄しました。同じ人を選び直して内容を確認してください。';
});
$('confirm-import').addEventListener('click',async()=>{
  if(busy||!activePreview||!$('confirm-single').checked)return;
  busy=true;$('confirm-import').disabled=true;$('cancel-confirm').disabled=true;
  try{
    // The file row is not resent here; only the server-issued preview token is confirmed.
    const result=await request('/commit',{previewId:activePreview.previewId,confirm:true});
    completed=true;dialog.close('committed');
    $('preview-status').textContent=result.alreadyImported?'この1人分はすでに反映済みです。最新の進行を保ちました。':'合成ローカルAPIで1人分の移行を完了しました。';
    fileStatus.textContent='合成データの保存を確認しました。元JSONは変更・削除していません。';
    $('continue-confirm').disabled=true;
  }catch(error){
    $('preview-status').textContent=showError(error);fileStatus.textContent='確定は完了していない可能性があります。元JSONは保管したまま、同じプレビューの再試行状態を確認してください。';
  }finally{busy=false;$('cancel-confirm').disabled=false;$('confirm-import').disabled=!$('confirm-single').checked;}
});

request('/status').then(status=>{
  setDestination(status.destination);
  if(status.canCommit!==true)$('integrity-note').textContent='移行元証明と担当者認可がないため、このローカル画面はプレビュー専用です。';
}).catch(error=>{fileStatus.textContent=showError(error);$('continue-confirm').disabled=true;});
