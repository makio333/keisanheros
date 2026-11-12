const EXPECTED_ORIGIN='https://legend-heroes2.web.app';
const validTime=value=>Number.isSafeInteger(value)&&value>=0;
const fmt=value=>new Date(value).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'long',timeStyle:'short'});

export function createAccountDeletionNotice({stage,state,purgeAfter,completedAt,completionProof,origin=EXPECTED_ORIGIN,now=Date.now()}={}){
  if(origin!==EXPECTED_ORIGIN)throw Error('account_deletion_notice_origin_not_allowed');
  if(stage==='received'){
    if(state!=='retention_pending'||!validTime(purgeAfter))throw Error('account_deletion_notice_state_mismatch');
    return Object.freeze({stage,delivery:'draft-only',to:null,subject:'アカウント削除申請を受け付けました',text:[
      'アカウント削除の申請を受け付けました。',
      `対象データは東京時間 ${fmt(purgeAfter)} まで保持されます。受付時点では削除完了ではありません。`,
      '申請直後から対象アカウントは利用停止となります。',
      '法律・会計上必要な決済記録は別に扱います。端末に保存されたコピーは、利用者側での削除が必要です。',
      `端末内コピーの確認: ${origin}/account-device-cleanup.html`,
      'この文面は下書きです。メールは送信されていません。',
    ].join('\n')});
  }
  if(stage==='retention-ended'){
    if(state!=='purging'||!validTime(purgeAfter)||!validTime(now)||now<purgeAfter)throw Error('account_deletion_notice_state_mismatch');
    return Object.freeze({stage,delivery:'draft-only',to:null,subject:'アカウントデータの削除処理を進めています',text:[
      'アカウントデータの保持期間が終了し、削除処理を進めています。',
      'この連絡は削除完了のお知らせではありません。処理を確認できた後、完了通知を別途お送りします。',
      'この文面は下書きです。メールは送信されていません。',
    ].join('\n')});
  }
  if(stage==='completed'){
    if(state!=='complete'||!validTime(purgeAfter)||!validTime(completedAt)||completedAt<purgeAfter||completionProof?.allSourcesComplete!==true||completionProof?.backupSuppressionVerified!==true||completionProof?.authUserDeleted!==true)throw Error('account_deletion_notice_completion_not_verified');
    return Object.freeze({stage,delivery:'draft-only',to:null,subject:'アカウントデータの削除が完了しました',text:[
      `サーバー上の対象データ削除を確認しました（東京時間 ${fmt(completedAt)}）。`,
      '決済・会計上保存が必要な記録は、ゲームデータと分けて扱っています。',
      '端末に残っているセーブや復旧コピーは遠隔削除できないため、必要に応じて利用者側で削除してください。',
      `端末内コピーの確認: ${origin}/account-device-cleanup.html`,
      'この文面は下書きです。メールは送信されていません。',
    ].join('\n')});
  }
  throw Error('account_deletion_notice_stage_not_allowed');
}
