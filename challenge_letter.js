const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
export function createChallengeLetter({step,index,grade,intro,onOpen,alreadyOpen=false}){
 const low=grade===1,root=make('section',null,'challenge-letter');root.dataset.state='sealed';
 const envelope=make('div',null,'letter-envelope');
 envelope.append(make('p',low?'ゆうしゃへ':'親愛なる勇者へ','envelope-addressee'),make('p','H I R U R U','envelope-sender'));
 const seal=make('span','H','letter-seal');seal.setAttribute('aria-hidden','true');
 const open=make('button',low?'ふうを あける':'封を開ける','letter-open');open.type='button';open.append(seal);open.setAttribute('aria-expanded','false');open.setAttribute('aria-controls','challenge-paper');envelope.append(open,make('span',`${String(index+1).padStart(2,'0')} / 05`,'envelope-number'));
 const paper=make('article',null,'challenge-paper');paper.id='challenge-paper';paper.hidden=true;paper.tabIndex=-1;paper.setAttribute('aria-label',low?'ひらいた ちょうせんじょう':'開封した挑戦状');
 const mark=make('img',null,'letter-corner-mark');mark.src='/assets/quest_enemies/hihiru-letter-mark.svg';mark.alt='怪盗の仮面と三角帽のマーク';mark.width=76;mark.height=76;
 const heading=make('header',null,'letter-paper-heading');heading.append(make('span','CHALLENGE LETTER','letter-eyebrow'),make('h3',low?`なぞ　${index+1}`:`第${index+1}の謎`),mark);paper.append(heading);
 if(index===0&&intro)paper.append(make('p',intro,'letter-invitation'));
 const reading=make('section',null,'letter-reading');reading.append(make('div',step.letter,'letter-story passage'));paper.append(reading);
 if(step.clue){const clue=make('aside',null,'letter-clue');clue.append(make('h4',low?'いっしょに とどいた メモ':'同封されたメモ'),make('p',step.clue));paper.append(clue);}
 const question=make('section',null,'letter-question');question.append(make('p',step.question,'question'));paper.append(question);if(step.extraction)paper.append(make('small',low?'もじの かずは、てがみに かいた かたちで かぞえろよ。':'文字数は、この手紙に書かれた形で数えてみろ。','letter-count-note'));
 const signature=make('footer',null,'letter-signature');signature.append(make('span','— Hiruru'),make('small',low?'かいとう ヒルル':'怪盗ヒルル'));paper.append(signature);
 open.onclick=()=>{if(root.dataset.state==='opened')return;root.dataset.state='opened';open.setAttribute('aria-expanded','true');envelope.hidden=true;paper.hidden=false;onOpen?.();paper.focus({preventScroll:true});};root.append(envelope,paper);if(alreadyOpen){root.dataset.state='opened';root.dataset.continuation='true';envelope.hidden=true;paper.hidden=false;onOpen?.();}return root;
}
export function letterProgress(current,solved){const nav=make('ol',null,'letter-progress');nav.setAttribute('aria-label',`挑戦状 ${current+1} / 5、${solved}問解読済み`);for(let i=0;i<5;i++){const item=make('li',null,i<solved?'is-solved':i===current?'is-current':'');if(i===current)item.setAttribute('aria-current','step');item.append(make('span',i<solved?'✓':String(i+1).padStart(2,'0')),make('small',i<solved?'解読':i===current?'挑戦中':'未読'));nav.append(item);}return nav;}
