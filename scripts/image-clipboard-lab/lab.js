const $=id=>document.getElementById(id);
const response=await fetch('/manifest');
if(!response.ok)throw Error('Local manifest unavailable');
const items=await response.json();
const select=$('event'), image=$('poster'), copyImage=$('copy-image'), copyText=$('copy-text'), status=$('status');
let prepared=null,version=0,pasteUrl='';
items.forEach((item,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=item.title;select.append(option);});
function tell(message,error=false){status.textContent=message;status.setAttribute('role',error?'alert':'status');}
async function prepare() {
  const request=++version, item=items[Number(select.value)];prepared=null;copyImage.disabled=true;copyText.disabled=true;
  $('read-result').textContent='このイベントの画像をコピーしてから、実データを確認してください。';
  $('paste-result').textContent='まだ貼り付けていません。';$('pasted').hidden=true;
  $('title').textContent=item.title;$('text').textContent=item.text;$('x').href='https://x.com/intent/tweet?text='+encodeURIComponent(item.text);
  tell('画像を準備中…');image.src=item.image;
  try {
    await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    canvas.getContext('2d').drawImage(image,0,0);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(request!==version)return;if(!blob||!canvas.width||!canvas.height)throw Error();
    prepared=blob;copyImage.disabled=!navigator.clipboard?.write||typeof ClipboardItem==='undefined';copyText.disabled=!navigator.clipboard?.writeText;
    tell(copyImage.disabled?'このブラウザでは画像コピーが使えません。':`画像をコピーできます（${canvas.width} × ${canvas.height}）。`);
  } catch {if(request===version)tell('画像を準備できませんでした。取得済みとは扱いません。',true);}
}
copyImage.addEventListener('click',async()=>{
  if(!prepared)return;
  try {await navigator.clipboard.write([new ClipboardItem({'image/png':prepared})]);tell('画像をコピーしました。先に画像を貼り付けてください。');}
  catch {tell('画像をコピーできませんでした。ブラウザの許可と接続方式を確認してください。',true);}
});
copyText.addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText(items[Number(select.value)].text);tell('投稿文をコピーしました。クリップボードの画像は上書きされました。');}
  catch {tell('投稿文をコピーできませんでした。',true);}
});
$('paste').addEventListener('paste',event=>{
  event.preventDefault();
  const file=[...event.clipboardData.items].find(item=>item.kind==='file'&&item.type.startsWith('image/'))?.getAsFile();
  if(!file){$('paste-result').textContent='画像は受け取っていません（文字のみ、または空のクリップボード）。';$('pasted').hidden=true;return;}
  if(pasteUrl)URL.revokeObjectURL(pasteUrl);pasteUrl=URL.createObjectURL(file);$('pasted').src=pasteUrl;$('pasted').hidden=false;
  $('paste-result').textContent=`画像を受け取りました：${file.type} / ${file.size.toLocaleString()} bytes`;
});
select.addEventListener('change',()=>void prepare());await prepare();
$('read-back').addEventListener('click',async()=>{
  try {
    const clipboard=await navigator.clipboard.read();
    const item=clipboard.find(item=>item.types.includes('image/png'));
    if(!item){$('read-result').textContent='クリップボードにPNG画像はありません。';return;}
    const blob=await item.getType('image/png');
    const bitmap=await createImageBitmap(blob);
    $('read-result').textContent=`クリップボード内の実画像を確認：${bitmap.width} × ${bitmap.height} / ${blob.type} / ${blob.size.toLocaleString()} bytes`;
    bitmap.close();
  } catch { $('read-result').textContent='この環境ではクリップボードの読取確認ができません。コピー成功とは別に確認が必要です。'; }
});
