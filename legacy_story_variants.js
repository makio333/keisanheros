// Distinct situations and semantic structures; numeric scope stays with the unlocked tier.
export const LEGACY_STORY_VERSION=3;
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
 // Living creatures are observed in their habitat, never delivered as objects.
 if(['ことり','さかな','かに'].includes(item)){
  const place=item==='ことり'?'き':'いけ',arrive=item==='ことり'?'とんできました':'やってきました';
  if(family==='add')text=[`${item}が ${a}こ います。あとから ${b}こ ${arrive}。いまは なんこ いますか。`,`${item}が みぎの ${place}に ${a}こ、ひだりの ${place}に ${b}こ います。あわせて なんこ ですか。`,`${item}を きのう ${a}こ、きょう ${b}こ みつけました。ふつかで なんこ みつけましたか。`,`${item}を ミナは ${a}こ みつけました。ソラは ミナより ${b}こ おおく みつけました。ソラは なんこ みつけましたか。`,`${item}を はじめに ${a}こ かぞえました。まだ かぞえていない ${item}が ${b}こ います。ぜんぶで なんこ いますか。`][i%5];
  if(family==='sub')text=[`${item}が ${a}こ います。そのうち ${b}こが べつの ばしょへ いきました。のこりは なんこ ですか。`,`${item}が みぎの ${place}に ${a}こ、ひだりの ${place}に ${b}こ います。かずの ちがいは なんこ ですか。`,`${item}を ぜんぶで ${a}こ かぞえます。いま ${b}こ かぞえました。あと なんこ かぞえますか。`,`${item}が ぜんぶで ${a}こ います。そのうち おおきいものは ${b}こです。おおきくないものは なんこ ですか。`,`${item}が はじめ ${a}こ いました。いま かぞえると ${b}こです。なんこ へりましたか。`][i%5];
  if(family==='mul')text=[`${item}が ひとつの ${place}に ${a}こずつ、${b}この ${place}に います。ぜんぶで なんこ ですか。`,`${item}が ${a}こずつ、${b}れつに ならんで います。ぜんぶで なんこ ですか。`,`${item}の しゃしんを ひとりに ${a}まいずつ、${b}にんに くばります。しゃしんは なんまい ひつようですか。`,`${item}を いちにちに ${a}こずつ みつけます。${b}にちで なんこ みつけますか。`,`${item}を いちどに ${a}こずつ かぞえます。${b}かいで なんこ かぞえますか。`][i%5];
  if(family==='div')text=[`${item}が ${a}こ います。${b}にんで おなじかずずつ かぞえると、ひとり なんこ かぞえますか。`,`${item}が ${a}こ います。${b}こずつの むれに なると、むれは いくつ できますか。`,`${item}の しゃしんが ${a}まい あります。いちにち ${b}まいずつ しらべると、なんにちぶん ですか。`,`${item}が ${a}こ、${b}この ${place}に おなじかずずつ います。ひとつの ${place}に なんこ いますか。`,`${item}を ${a}こ かぞえます。いちどに ${b}こずつ かぞえると、ぴったり かぞえおわるには なんかい ですか。`][i%5];
 }
 if(p.remainder!=null&&p.remainder>0)text=text.replace(/ですか。$/,'ですか。あまりも こたえましょう。');
 const unit=units[item]||'こ';text=text.replace(/なんこ/g,'なん'+unit).replace(/(\d+)こ(?!の|ずつの)/g,'$1'+unit);
 return {...p,text,isWordProblem:true,scenario:name,semanticPattern:family+'-'+i};});
 return {...q,title:scene+'で '+FAMILY[family],parts,storyVersion:LEGACY_STORY_VERSION,storyVariant:variant%SCENES.length,grade:legacyStoryGrade(q.tier)};
}
