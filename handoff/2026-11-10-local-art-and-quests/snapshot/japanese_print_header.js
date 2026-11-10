// Place metadata beneath the vertical title, instead of spending a full column per field.
export function japanesePrintHeader(title,metadata,rewards='',extra=''){
 return `<header class="jp-print-header ${extra}"><div class="jp-title-stack"><h1>${title}</h1><div class="jp-print-meta">${metadata}</div></div>${rewards}</header>`;
}
export const japanesePrintHeaderCss=`
.jp-print-number{text-combine-upright:all;font-variant-numeric:tabular-nums}
.jp-print-header{writing-mode:horizontal-tb!important;display:flex!important;flex-direction:row-reverse;gap:2mm;padding:0!important;border:0!important;align-items:flex-start}
.jp-print-header .jp-title-stack{display:flex;flex-direction:column;align-items:center;gap:3mm;width:18mm;height:179mm;flex:0 0 18mm;min-width:0}
.jp-print-header .jp-title-stack h1{writing-mode:vertical-rl;text-orientation:upright;font-size:13pt!important;line-height:1.4;max-height:98mm;flex:0 1 auto;margin:0!important;padding:0!important;max-width:18mm}
.jp-print-header .jp-print-meta{writing-mode:vertical-rl;text-orientation:upright;width:18mm;height:70mm;flex:0 0 70mm;margin:0!important}
.jp-print-header .jp-print-meta p{font:8pt/1.5 sans-serif!important;white-space:nowrap;margin:0 0 0 1mm!important}
.jp-print-header .jp-print-meta .wpp2-name-line,.jp-print-header .jp-print-meta .sp-name-line{height:44mm;width:3.5mm;margin-top:2mm}
.jp-print-header .jp-print-meta .wpp2-date-line,.jp-print-header .jp-print-meta .sp-date-line{height:35mm}
.jp-print-header>.wpp2-reward,.jp-print-header>.sp-rewards{writing-mode:vertical-rl;text-orientation:upright;flex:1;min-width:0}
`;
