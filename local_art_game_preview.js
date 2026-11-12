// Development-only controls for inspecting the actual game with in-memory data.
export function openLocalArtGamePreview(api) {
  const toolbar=document.createElement('nav');
  toolbar.setAttribute('aria-label','ゲーム内の絵柄確認');
  toolbar.id='local-art-preview-tools';
  Object.assign(toolbar.style,{position:'fixed',top:'6px',left:'50%',transform:'translateX(-50%)',zIndex:'30000',display:'flex',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:'6px',padding:'8px',maxWidth:'calc(100vw - 20px)',width:'max-content',background:'#241e30f5',color:'#fff5df',border:'1px solid #d0ad73',borderRadius:'12px',fontSize:'12px'});
  const label=document.createElement('span');label.textContent='絵柄確認・保存なし';toolbar.append(label);
  for(const [title,entries,change] of [['キャラクター',api.characters,api.character],['武器',api.weapons,api.weapon],['敵',api.enemies,api.enemy]]){
    const select=document.createElement('select');select.setAttribute('aria-label',title);select.style.maxWidth='160px';
    entries.forEach(e=>select.add(new Option(e.name,e.id)));
    if(title==='敵')select.value=api.selectedEnemy;
    select.onchange=()=>change(select.value);toolbar.append(select);
  }
  for(const [name,action] of [['拠点',api.home],['部屋・装備',api.room],['キャラ選択',api.selector],['戦闘',api.battle]]){
    const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=action;toolbar.append(button);
  }
  document.body.append(toolbar);
}
