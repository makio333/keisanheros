// Distinct situations and semantic structures; numeric scope stays with the unlocked tier.
export const LEGACY_STORY_VERSION=2;
const SCENES=[
 ['そらの はいたつきょく',['てがみ','はがき','きって','ふうとう','こづつみ']],
 ['もりの かんそくごや',['ことり','きのみ','はっぱ','たね','はね']],
 ['みずべの いきものちょうさ',['かいがら','さかな','いし','みずくさ','かに']],
 ['むらの げきじょう',['きっぷ','いす','ぼうし','はな','かざり']],
 ['ほしの てんもんだい',['ほしのカード','きろくカード','ほしのシール','しゃしん','ほしのもけい']],
 ['たびの はくぶつかん',['こいん','つぼ','こうせき','えはがき','ちず']],
];
const FAMILY={add:'あつめる',sub:'たしかめる',mul:'ならべる',div:'わける'};
export function legacyStoryGrade(tier){const family=tier.replace(/[0-9]/g,''),n=Number(tier.slice(-1));return family==='add'?(n<=2?1:2):family==='sub'?(n===1?1:2):family==='mul'?(n<=3?2:3):3;}
export function rewriteLegacyStory(q,variant=Number(q.uid)||0){const family=String(q.tier).replace(/[0-9]/g,''),[scene,items]=SCENES[((variant%SCENES.length)+SCENES.length)%SCENES.length];
 const units={てがみ:'つう',はがき:'まい',きって:'まい',ふうとう:'まい',ことり:'わ',はっぱ:'まい',はね:'まい',かいがら:'まい',さかな:'ひき',みずくさ:'ほん',かに:'ひき',きっぷ:'まい',いす:'きゃく',はな:'ほん','ほしのカード':'まい',きろくカード:'まい','ほしのシール':'まい',しゃしん:'まい',こいん:'まい',えはがき:'まい',ちず:'まい'};
 const parts=q.parts.map((p,i)=>{const a=p.a,b=p.b,item=items[i%items.length],name=`${item}の しらべもの`;let text;
 if(family==='add')text=[`${item}が ${a}こ あります。あとから ${b}こ とどきました。いまは なんこ ありますか。`,`${item}を あかいはこに ${a}こ、あおいはこに ${b}こ いれました。あわせて なんこ ですか。`,`${item}を きのう ${a}こ、きょう ${b}こ みつけました。ふつかで なんこ みつけましたか。`,`${item}を ミナは ${a}こ もっています。ソラは ミナより ${b}こ おおく もっています。ソラは なんこ もっていますか。`,`${item}を はじめに ${a}こ かぞえました。まだ かぞえていないものが ${b}こ あります。ぜんぶで なんこ ありますか。`][i%5];
 if(family==='sub')text=[`${item}が ${a}こ あり、そのうち ${b}こを べつのばしょへ はこびました。のこりは なんこ ですか。`,`${item}は あかいはこに ${a}こ、あおいはこに ${b}こ あります。かずの ちがいは なんこ ですか。`,`${item}を ぜんぶで ${a}こ あつめます。いま ${b}こ あつまっています。あと なんこ ひつようですか。`,`${item}は ぜんぶで ${a}こ あります。そのうち おおきいものは ${b}こです。おおきくないものは なんこ ですか。`,`${item}は はじめ ${a}こ ありました。いま かぞえると ${b}こです。なんこ へりましたか。`][i%5];
 if(family==='mul')text=[`${item}を ひとはこに ${a}こずつ、${b}はこに いれます。ぜんぶで なんこ ですか。`,`${item}を よこに ${a}こずつ、${b}れつ ならべます。ぜんぶで なんこ ならびますか。`,`${item}を ひとりに ${a}こずつ、${b}にんに くばります。なんこ ひつようですか。`,`${item}を いちにちに ${a}こずつ みつけます。${b}にちで なんこ みつけますか。`,`${item}を いちどに ${a}こずつ はこびます。${b}かいで なんこ はこべますか。`][i%5];
 if(family==='div')text=[`${item}が ${a}こ あります。${b}にんに おなじかずずつ わけると、ひとり なんこ ですか。`,`${item}が ${a}こ あります。ひとはこに ${b}こずつ いれると、なんはこ できますか。`,`${item}を ${a}こ あつめました。いちにち ${b}こずつ つかうと、なんにちぶん ですか。`,`${item}を ${a}こ、${b}この たなに おなじかずずつ ならべます。ひとつの たなに なんこ ですか。`,`${item}を ${a}こ はこびます。いちどに ${b}こ はこべるとき、ぴったり はこびきるには なんかい ですか。`][i%5];
 if(p.remainder!=null&&p.remainder>0)text=text.replace(/ですか。$/,'ですか。あまりも こたえましょう。');
 const unit=units[item]||'こ';text=text.replace(/なんこ/g,'なん'+unit).replace(/(\d+)こ(?!の|ずつの)/g,'$1'+unit);
 return {...p,text,isWordProblem:true,scenario:name,semanticPattern:family+'-'+i};});
 return {...q,title:scene+'で '+FAMILY[family],parts,storyVersion:LEGACY_STORY_VERSION,storyVariant:variant%SCENES.length,grade:legacyStoryGrade(q.tier)};
}
