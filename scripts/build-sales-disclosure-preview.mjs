import {copyFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'sales-pages');
const output=path.join(root,'dist-sales-disclosure-preview');
await mkdir(output,{recursive:true});
for(const name of ['commerce.html','privacy.html','terms.html'])await copyFile(path.join(source,name),path.join(output,name));
await writeFile(path.join(output,'index.html'),`<!doctype html>
<html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>販売ページ下書きプレビュー</title>
<body style="font:16px/1.7 system-ui,sans-serif;max-width:760px;margin:3rem auto;padding:0 1rem;color:#202438"><h1>販売ページ下書きプレビュー</h1><p><strong>これはローカル確認用です。未確定情報を含むため、公開・Stripe登録には使えません。</strong></p><ul><li><a href="commerce.html">特定商取引法に基づく表記</a></li><li><a href="privacy.html">プライバシーポリシー</a></li><li><a href="terms.html">利用規約</a></li></ul><p>本番公開物とは別フォルダーに出力しています。販売者情報、返金条件、利用対象、問い合わせ窓口、プライバシーの実設定確認が終わるまで公開不可です。</p></body></html>`,{encoding:'utf8'});
await writeFile(path.join(output,'PREVIEW-ONLY.txt'),`LOCAL SALES DISCLOSURE PREVIEW\n\nNot deployable. Contains unresolved placeholders. Do not register its file:// paths with Stripe.\nSource: sales-pages/\nPublic hosting target, if separately approved after review: https://legend-heroes2.web.app/\n`);
console.log(`Created unpublished local preview at ${output}`);
