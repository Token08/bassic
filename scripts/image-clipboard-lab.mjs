// Loopback-only clipboard laboratory. No provider credentials or publishing APIs.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {rasterType} from './facebook-image-probe.mjs';

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
const server=createServer((request,response)=>{
  const send=(code,type,data)=>{response.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' blob:; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'",'Permissions-Policy':'clipboard-write=(self), clipboard-read=(self)'});response.end(data);};
  if(request.headers.host!==host||request.method!=='GET')return send(403,'text/plain','Local read-only lab');
  const path=new URL(request.url,`http://${host}`).pathname;
  if(path==='/')return send(200,'text/html; charset=utf-8',html);
  if(path==='/lab.js')return send(200,'text/javascript; charset=utf-8',js);
  if(path==='/manifest')return send(200,'application/json',JSON.stringify(assets.map((a,i)=>({title:a.title,text:a.text,image:`/images/${i}`}))));
  const index=/^\/images\/(\d)$/.exec(path)?.[1];
  const asset=index!==undefined?assets[Number(index)]:null;
  if(asset)return send(200,asset.type,asset.bytes);
  return send(404,'text/plain','Not found');
});
server.listen(port,'127.0.0.1',()=>console.log(`Image clipboard lab: http://${host}/ (local only; ${assets.length} verified browser images; never publishes)`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
