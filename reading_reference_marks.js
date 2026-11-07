export function appendReadingReferenceText(container,text,references=[]){
 const source=String(text??'');
 const matches=references.map(reference=>({
  ...reference,
  start:source.indexOf(reference.text)
 })).filter(reference=>reference.start>=0).sort((a,b)=>a.start-b.start);
 let cursor=0;
 for(const reference of matches){
  const end=reference.start+reference.text.length;
  if(reference.start<cursor)continue;
  container.append(document.createTextNode(source.slice(cursor,reference.start)));
  const marked=document.createElement('span');marked.className='reading-reference-mark';
  marked.setAttribute('aria-label',`下線部${reference.label}「${reference.text}」`);
  const label=document.createElement('span');label.className='reading-reference-label';label.setAttribute('aria-hidden','true');label.textContent=reference.label;
  const underline=document.createElement('u');underline.className='reading-reference-underline';underline.textContent=reference.text;
  marked.append(label,underline);container.append(marked);cursor=end;
 }
 container.append(document.createTextNode(source.slice(cursor)));
}
