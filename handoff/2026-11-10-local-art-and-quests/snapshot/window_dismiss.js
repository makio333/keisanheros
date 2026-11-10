import './window_dismiss.css';
const PANEL='.panel,.modal-panel,.confirm-card,.command-window,.raid-result-panel,.reward-artwork-preview-panel,.reward-artwork-panel,.skin-gacha-reveal-panel,.skin-gacha-ten-panel,.halloween-hub-panel,.skin-gacha-preview-panel,.avatar-selector-panel,.kuku-shell,dialog';
const HEADER='header,.avatar-selector-header,.raid-menu-header,.gacha-page-header,.quest-board-header';
function isDismiss(button){
 if(button.closest('.window-dismiss-bar'))return false;
 if(button.matches('.window-nav-btn,[data-close],.kuku-close,.battle-menu-back,[data-window-dismiss],[data-action="close"],button[id$="-close"]'))return true;
 const text=button.textContent.trim().replace(/[×✕✖←↩⚙]/g,'').trim();
 return /^(?:とじる|閉じる|もどる|戻る|きょてんに戻る|きょてんへもどる|レイドへもどる|.*(?:へ|に)\s*(?:もどる|戻る)|やめる|キャンセル)$/.test(text);
}
function normalize(button){
 if(!isDismiss(button))return;
 const panel=button.closest(PANEL);if(!panel)return;
 // Confirmation alternatives remain paired; these are choices rather than window navigation.
 if(button.closest('.confirm-actions')&&!button.matches('.window-nav-btn,[data-close],[data-window-dismiss]'))return;
 const header=button.closest(HEADER);
 button.classList.add('window-dismiss-action');panel.classList.add('window-dismiss-panel');
 if(header&&panel.contains(header)){
  header.classList.add('window-dismiss-header');
  if(header.firstElementChild!==button)header.prepend(button);
  return;
 }
 let bar=panel.querySelector(':scope > .window-dismiss-bar');
 if(!bar){bar=document.createElement('div');bar.className='window-dismiss-bar';panel.prepend(bar);}
 bar.append(button);
}
function scan(root){
 if(root.nodeType!==Node.ELEMENT_NODE)return;
 if(root.matches('button'))normalize(root);
 root.querySelectorAll('button').forEach(normalize);
}
scan(document.body);
const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node);});
observer.observe(document.body,{childList:true,subtree:true});
