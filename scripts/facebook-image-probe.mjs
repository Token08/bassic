// Read-only feasibility probe. No CMS writes, cookies, API tokens or publication.
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function approvedUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const allowed = ['www.facebook.com','facebook.com','m.facebook.com','lookaside.fbsbx.com'].includes(host) ||
    /^scontent[.-][a-z0-9.-]+\.fbcdn\.net$/.test(host);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowed) throw Error('unapproved-host');
  return url;
}
export function decodeEntities(value) {
  return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;/g,"'")
    .replace(/&#x([0-9a-f]+);/gi,(_,v)=>String.fromCodePoint(parseInt(v,16)))
    .replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(Number(v)));
}
export function metaContent(html, name) {
  for(const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = Object.fromEntries([...match[0].matchAll(/([a-z-]+)\s*=\s*["']([^"']*)["']/gi)].map(m=>[m[1].toLowerCase(),decodeEntities(m[2])]));
    if(attributes.property===name || attributes.name===name) return attributes.content || '';
  }
  return '';
}
export function bridgePhotoUrl(html) {
  const match=html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*content=["']0;url=([^"']+)["']/i);
  if(!match) return '';
  const url=approvedUrl(decodeEntities(match[1]));
  if(!['www.facebook.com','facebook.com'].includes(url.hostname) || !['/photo.php','/photo/'].includes(url.pathname) || !/^\d+$/.test(url.searchParams.get('fbid')||'')) throw Error('unrelated-bridge');
  return url.href;
}
export function rasterType(bytes) {
  if(bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) return 'image/jpeg';
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  return '';
}
async function limitedBody(response, limit) {
  const reader=response.body?.getReader(); if(!reader) throw Error('empty-body');
  const chunks=[];let length=0;
  try { for(;;) {const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('body-too-large');chunks.push(Buffer.from(value));} }
  catch(error) {await reader.cancel().catch(()=>{});throw error;}
  return Buffer.concat(chunks);
}
export async function probeEventImage(eventUrl,{fetchImpl=fetch,outputDirectory}={}) {
  const event=approvedUrl(eventUrl);
  if(event.hostname!=='www.facebook.com' || !/^\/events\/\d+\/$/.test(event.pathname)||event.search) throw Error('individual-event-required');
  const id=event.pathname.split('/')[2], steps=[];
  let title='',photoId='', candidate='';
  async function read(value) {
    let url=approvedUrl(value);
    for(let hop=0;hop<4;hop++) {
      const response=await fetchImpl(url.href,{headers:{'User-Agent':'Mozilla/5.0 (compatible; BassicAdmin/1.0)'},redirect:'manual',signal:AbortSignal.timeout(15000)});
      steps.push({host:url.hostname,path:url.pathname,status:response.status,type:response.headers.get('content-type')||''});
      if(response.status>=300 && response.status<400) {await response.body?.cancel();url=approvedUrl(new URL(response.headers.get('location')||'',url).href);continue;}
      if(!response.ok) {await response.body?.cancel();throw Error('http-'+response.status);}
      const bytes=await limitedBody(response,10*1024*1024);
      const type=rasterType(bytes);
      if(type && response.headers.get('content-type')?.split(';')[0]===type) return {bytes,type};
      if(response.headers.get('content-type')?.startsWith('text/html')) return {html:bytes.toString('utf8')};
      throw Error('not-a-supported-image');
    }
    throw Error('redirect-limit');
  }
  try {
    const page=await read(event.href); if(!page.html)throw Error('event-page-missing');
    title=metaContent(page.html,'og:title');
    if(!title || /^(facebook|log\s*in|ログイン)(\s|$)/i.test(title))throw Error('event-identity-missing');
    candidate=metaContent(page.html,'og:image');if(!candidate)throw Error('event-image-missing');
    let result=await read(candidate);
    if(result.html) {
      const photo=bridgePhotoUrl(result.html);if(!photo)throw Error('image-returned-html');
      photoId=new URL(photo).searchParams.get('fbid');
      const photoPage=await read(photo);if(!photoPage.html)throw Error('photo-page-missing');
      candidate=metaContent(photoPage.html,'og:image');if(!candidate)throw Error('photo-page-has-no-image-metadata');
      result=await read(candidate);
    }
    if(!result.bytes)throw Error('image-returned-html');
    if(!/scontent[.-]/.test(new URL(candidate).hostname) && !candidate.includes('lookaside.fbsbx.com'))throw Error('generic-image-rejected');
    const fileName=`${id}.${result.type==='image/png'?'png':'jpg'}`;
    if(outputDirectory) {await mkdir(outputDirectory,{recursive:true});await writeFile(resolve(outputDirectory,fileName),result.bytes);}
    return {id,title,photoId,ok:true,type:result.type,bytes:result.bytes.length,fileName,steps};
  } catch(error) {return {id,title,photoId,ok:false,reason:error.message,steps};}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [directory,...urls]=process.argv.slice(2);if(!directory||!urls.length)throw Error('Usage: node scripts/facebook-image-probe.mjs OUTPUT_DIRECTORY EVENT_URL...');
  const results=[];for(const url of urls) {const result=await probeEventImage(url,{outputDirectory:directory});results.push(result);console.log(JSON.stringify(result));}
  await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
}
