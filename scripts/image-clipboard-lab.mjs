// Loopback-only clipboard laboratory. No provider credentials or publishing APIs.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {rasterType} from './facebook-image-probe.mjs';
import {browserProbe} from './facebook-image-browser-probe.mjs';
import {pathToFileURL} from 'node:url';

const manifestPath=process.argv[2];
if(!manifestPath)throw Error('Usage: node scripts/image-clipboard-lab.mjs LOCAL_MANIFEST.json');
const records=JSON.parse(await readFile(manifestPath,'utf8'));
if(!Array.isArray(records)||!records.length||records.length>3)throw Error('One to three local images required');
const assets=await Promise.all(records.map(async r=>{
  if(typeof r.title!=='string'||typeof r.file!=='string')throw Error('Invalid manifest');
  const bytes=await readFile(resolve(r.file)), type=rasterType(bytes);
  if(!type||bytes.length>10*1024*1024)throw Error('JPEG or PNG, up to 10 MB required');
  return {bytes,type,title:r.title,text:r.text||r.title};
}));
const html=await readFile(new URL('./image-clipboard-lab/index.html',import.meta.url));
const js=await readFile(new URL('./image-clipboard-lab/lab.js',import.meta.url));
const port=Number(process.env.BASSIC_IMAGE_LAB_PORT||3133);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const host=`127.0.0.1:${port}`;
const probeEnabled=process.env.BASSIC_IMAGE_LAB_BROWSER==='true';
if(probeEnabled&&assets.length!==3)throw Error('Browser probe requires the three-image QA manifest');
const eventIds=['1821212975591464','29205926255674734','2385993572172152'];
let probing=false;
const server=createServer(async(request,response)=>{
  const send=(code,type,data)=>{response.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' blob:; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'",'Permissions-Policy':'clipboard-write=(self), clipboard-read=(self)'});response.end(data);};
  if(request.headers.host!==host)return send(403,'text/plain','Local read-only lab');
  const path=new URL(request.url,`http://${host}`).pathname;
  if(path==='/probe'&&request.method==='POST') {
    if(!probeEnabled)return send(403,'application/json',JSON.stringify({ok:false,message:'この環境では自動取得の検証を有効にしていません。'}));
    if(request.headers.origin!==`http://${host}`||request.headers['content-type']!=='application/json')return send(403,'application/json',JSON.stringify({ok:false,message:'検証画面から実行してください。'}));
    if(probing)return send(409,'application/json',JSON.stringify({ok:false,message:'画像を取得中です。完了を待ってください。'}));
    let browser,timer,ownsProbe=false;
    try {
      let body='';for await(const chunk of request){body+=chunk;if(Buffer.byteLength(body)>4096)return send(413,'application/json',JSON.stringify({ok:false,message:'URLが長すぎます。'}));}
      let url;try{url=new URL(JSON.parse(body).url);}catch{return send(400,'application/json',JSON.stringify({ok:false,message:'FacebookイベントURLを入力してください。'}));}
      const id=/^\/events\/(\d+)\/$/.exec(url.pathname)?.[1];
      if(url.protocol!=='https:'||url.hostname!=='www.facebook.com'||url.port||url.username||url.password||url.search||url.hash||!eventIds.includes(id))return send(400,'application/json',JSON.stringify({ok:false,message:'この検証では確認済みの3件の個別イベントURLだけを使えます。'}));
      if(probing)return send(409,'application/json',JSON.stringify({ok:false,message:'画像を取得中です。完了を待ってください。'}));
      probing=true;ownsProbe=true;
      const {chromium}=await import(process.env.BASSIC_QA_PLAYWRIGHT?pathToFileURL(resolve(process.env.BASSIC_QA_PLAYWRIGHT,'index.mjs')).href:'playwright');
      browser=await chromium.launch({headless:true,...(process.env.BASSIC_QA_CHROMIUM?{executablePath:process.env.BASSIC_QA_CHROMIUM}:{})});
      timer=setTimeout(()=>void browser.close(),45000);
      let image;
      const result=await browserProbe(browser,url.href,undefined,{onImage:value=>{image=value;}});
      if(!result.ok||!image)return send(502,'application/json',JSON.stringify({ok:false,message:'告知画像を取得できませんでした。取得済みとは扱いません。'}));
      // One in-memory image per fixed event, never CMS storage or files.
      const slot=eventIds.indexOf(id),record={...image,title:result.title,text:`【検証・投稿しません】\n${result.title}`};
      assets[slot]=record;
      return send(200,'application/json',JSON.stringify({ok:true,data:{title:record.title,text:record.text,image:`/images/${slot}`,width:result.width,height:result.height}}));
    }catch{return send(502,'application/json',JSON.stringify({ok:false,message:'画像取得の検証を実行できませんでした。'}));}
    finally{clearTimeout(timer);await browser?.close().catch(()=>{});if(ownsProbe)probing=false;}
  }
  if(request.method!=='GET')return send(403,'text/plain','Local read-only lab');
  if(path==='/')return send(200,'text/html; charset=utf-8',html);
  if(path==='/lab.js')return send(200,'text/javascript; charset=utf-8',js);
  if(path==='/manifest')return send(200,'application/json',JSON.stringify(assets.map((a,i)=>({title:a.title,text:a.text,image:`/images/${i}`}))));
  if(path==='/capabilities')return send(200,'application/json',JSON.stringify({probeEnabled}));
  const index=/^\/images\/(\d)$/.exec(path)?.[1];
  const asset=index!==undefined?assets[Number(index)]:null;
  if(asset)return send(200,asset.type,asset.bytes);
  return send(404,'text/plain','Not found');
});
server.listen(port,'127.0.0.1',()=>console.log(`Image clipboard lab: http://${host}/ (local only; ${assets.length} verified browser images; never publishes)`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
