const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function japanesePrintMetadata({grade,name=''}={}){
 return `<div class="jp-student-meta"><div class="jp-grade">${esc(grade)}年 国語</div><div class="jp-date-row"><span><i></i>月</span><span><i></i>日</span></div><div class="jp-name-label">名前</div><div class="jp-name-entry">${esc(name)}</div></div>`;
}
export function japanesePrintHeader(title,metadata,rewards='',extra=''){
 return `<header class="jp-print-header ${extra}"><div class="jp-title-stack"><h1>${title}</h1><div class="jp-print-meta">${metadata}</div></div>${rewards}</header>`;
}
export const japanesePrintHeaderCss=`
.jp-print-number{text-combine-upright:all;font-variant-numeric:tabular-nums}
.jp-print-header{writing-mode:horizontal-tb!important;display:flex!important;flex-direction:row-reverse;gap:2mm;padding:0!important;border:0!important;align-items:flex-start}
.jp-print-header .jp-title-stack{display:flex;flex-direction:column;align-items:center;gap:3mm;width:18mm;height:179mm;flex:0 0 18mm;min-width:0}
.jp-print-header .jp-title-stack h1{writing-mode:vertical-rl;text-orientation:upright;font-size:13pt!important;line-height:1.4;max-height:98mm;flex:0 1 auto;min-height:0;min-width:0;margin:0!important;padding:0!important;max-width:18mm}
.jp-print-header .jp-print-meta{writing-mode:horizontal-tb!important;width:18mm;min-height:60mm;flex:1 1 70mm;margin:0!important}
.jp-student-meta{display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100%;font:10pt/1.5 'Yu Mincho','Hiragino Mincho ProN',serif}
.jp-grade{flex:0 0 6mm;font:8pt/1.4 sans-serif;text-align:center;white-space:nowrap}
.jp-date-row{display:flex;flex:0 0 10mm;align-items:flex-end;justify-content:space-between;gap:1mm;padding-bottom:1.5mm;border-bottom:.3mm solid #333;white-space:nowrap}
.jp-date-row>span{display:flex;align-items:baseline;flex:1;min-width:0;gap:.5mm}
.jp-date-row i{display:inline-block;flex:1;min-width:2mm;height:5mm}
.jp-name-label{flex:0 0 9mm;display:flex;justify-content:center;align-items:center;letter-spacing:.3em;font-size:13pt}
.jp-name-entry{flex:1;min-height:0;writing-mode:vertical-rl;text-orientation:upright;text-align:start;padding:2mm 4mm;border-bottom:.3mm solid #333;font-size:13pt;white-space:pre-wrap;overflow-wrap:anywhere}
.jp-print-header>.wpp2-reward,.jp-print-header>.sp-rewards{writing-mode:vertical-rl;text-orientation:upright;flex:1 1 0;min-width:0;height:179mm;max-height:179mm;display:flex;flex-direction:column;box-sizing:border-box}
`;

// The reward column retains its original location beside the title/name stack.
