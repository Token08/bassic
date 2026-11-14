// Isolated backend feasibility experiment, never a production integration.
// New browser context only: no saved profile, cookies, account or publishing.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {approvedUrl,probeEventImage,rasterType} from './facebook-image-probe.mjs';

export function selectCover(candidates,photoId) {
  if(!/^\d+$/.test(photoId||''))throw Error('photo-identity-missing');
  const covers=candidates.filter(candidate=>{
    try {
      const photo=approvedUrl(candidate.href),image=approvedUrl(candidate.src);
      return ['www.facebook.com','facebook.com'].includes(photo.hostname) &&
        ['/photo/','/photo.php'].includes(photo.pathname) && photo.searchParams.get('fbid')===photoId &&
        image.hostname.startsWith('scontent') && candidate.width>=300 && candidate.height>=200;
    } catch {return false;}
  });
  const urls=[...new Set(covers.map(c=>c.src))];
  if(urls.length!==1)throw Error(urls.length?'ambiguous-cover':'event-cover-not-rendered');
  return covers.find(c=>c.src===urls[0]);
}
async function downloadImage(value) {
  let url=approvedUrl(value);
  for(let hop=0;hop<4;hop++) {
    const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
    if(response.status>=300&&response.status<400) {await response.body?.cancel();url=approvedUrl(new URL(response.headers.get('location')||'',url).href);continue;}
    if(!response.ok){await response.body?.cancel();throw Error('image-http-'+response.status);}
    const reader=response.body.getReader(),chunks=[];let length=0;
    try {for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>10*1024*1024)throw Error('image-too-large');chunks.push(Buffer.from(value));}}
    catch(error){await reader.cancel().catch(()=>{});throw error;}
    const bytes=Buffer.concat(chunks),type=rasterType(bytes);
    if(!type||response.headers.get('content-type')?.split(';')[0]!==type)throw Error('image-not-a-raster');
    return {bytes,type};
  }
  throw Error('image-redirect-limit');
}
export async function browserProbe(browser,eventUrl,outputDirectory) {
  const metadata=await probeEventImage(eventUrl);
  const result={id:metadata.id,title:metadata.title,photoId:metadata.photoId,httpReason:metadata.reason||'transport-succeeded'};
  if(!metadata.title||!metadata.photoId)return {...result,ok:false,reason:'event-photo-metadata-unavailable'};
  const context=await browser.newContext({locale:'ja-JP',timezoneId:'Asia/Tokyo',acceptDownloads:false});
  try {
    const page=await context.newPage();
    await page.goto(eventUrl,{waitUntil:'domcontentloaded',timeout:30000});
    // Read rendered public DOM only. Never dismiss challenges or log in.
    await page.locator(`a[href*="fbid=${metadata.photoId}"] img`).first().waitFor({state:'attached',timeout:20000});
    await page.waitForFunction(photoId=>[...document.querySelectorAll('a[href*="fbid="] img')].some(image=>{
      try{return new URL(image.closest('a').href).searchParams.get('fbid')===photoId&&image.complete&&image.naturalWidth>=300;}catch{return false;}
    }),metadata.photoId,{timeout:15000});
    const snapshot=await page.evaluate(()=>({
      title:document.querySelector('meta[property="og:title"]')?.content||'',
      candidates:[...document.querySelectorAll('a[href*="fbid="] img')].map(image=>({href:image.closest('a').href,src:image.currentSrc||image.src,width:image.naturalWidth,height:image.naturalHeight}))
    }));
    if(snapshot.title!==metadata.title)throw Error('event-title-mismatch');
    const cover=selectCover(snapshot.candidates,metadata.photoId);
    const {bytes,type}=await downloadImage(cover.src);
    const fileName=`${metadata.id}.${type==='image/png'?'png':'jpg'}`;
    await mkdir(outputDirectory,{recursive:true});await writeFile(resolve(outputDirectory,fileName),bytes);
    return {...result,ok:true,fileName,type,bytes:bytes.length,width:cover.width,height:cover.height};
  } catch(error) {
    // Playwright errors may contain signed URLs. Only record a fixed diagnostic.
    const reason=error?.name==='TimeoutError'?'public-page-did-not-render-target-cover':
      /^(ambiguous-cover|event-cover-not-rendered|event-title-mismatch|image-[a-z-]+|image-http-[1-5]\d\d|unapproved-host)$/.test(error.message)?error.message:'browser-probe-failed';
    return {...result,ok:false,reason};
  } finally {await context.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [flag,directory,...urls]=process.argv.slice(2);
  if(flag!=='--execute-public-probe'||!directory||!urls.length||urls.length>3)throw Error('Usage: node scripts/facebook-image-browser-probe.mjs --execute-public-probe OUTPUT_DIRECTORY EVENT_URL... (maximum 3)');
  for(const value of urls){const url=approvedUrl(value);if(url.hostname!=='www.facebook.com'||!/^\/events\/\d+\/$/.test(url.pathname)||url.search)throw Error('individual-event-required');}
  const {chromium}=await import(process.env.BASSIC_QA_PLAYWRIGHT?pathToFileURL(resolve(process.env.BASSIC_QA_PLAYWRIGHT,'index.mjs')).href:'playwright');
  const browser=await chromium.launch({headless:true,...(process.env.BASSIC_QA_CHROMIUM?{executablePath:process.env.BASSIC_QA_CHROMIUM}:{})});
  const results=[];
  try {for(const url of urls){const result=await browserProbe(browser,url,directory);results.push(result);console.log(JSON.stringify(result));}}
  finally {await browser.close();}
  await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'browser-report.json'),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
}
