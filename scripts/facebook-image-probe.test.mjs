import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approvedUrl,bridgePhotoUrl,rasterType,probeEventImage} from './facebook-image-probe.mjs';
const event='https://www.facebook.com/events/1821212975591464/';
const meta='<meta property="og:title" content="RUNT / Little&#x2606;Star"><meta property="og:image" content="https://lookaside.fbsbx.com/cover">';
const html=s=>new Response(s,{headers:{'content-type':'text/html'}});
test('public HTTPS Facebook/CDN only, no credentials/ports or suffix impostors',()=>{
  for(const u of ['http://www.facebook.com/','https://127.0.0.1/','https://scontent.evil.test/','https://www.facebook.com.evil.test/','https://user:pass@www.facebook.com/','https://www.facebook.com:8080/'])assert.throws(()=>approvedUrl(u));
});
test('HTML bridge is not an image; missing metadata stays unresolved',async()=>{
  let calls=0;const result=await probeEventImage(event,{fetchImpl:async()=>++calls===1?html(meta):calls===2?html('<meta http-equiv="refresh" content="0;url=https://www.facebook.com/photo.php?fbid=123&amp;type=3">'):html('<title>Facebook login</title>')});
  assert.equal(result.ok,false);assert.equal(result.reason,'photo-page-has-no-image-metadata');assert.equal(result.photoId,'123');assert.equal(result.title,'RUNT / Little☆Star');
});
test('metadata-selected JPEG header and MIME pass the transport probe',async()=>{
  const result=await probeEventImage(event,{fetchImpl:async url=>url===event?html(meta):new Response(Buffer.from([255,216,255,224,0,0]),{headers:{'content-type':'image/jpeg'}})});
  assert.equal(result.ok,true);assert.equal(result.type,'image/jpeg');
  assert.equal(rasterType(Buffer.from('<html>')),'');
});
test('login metadata and event-list URLs cannot become event image success',async()=>{
  assert.equal((await probeEventImage(event,{fetchImpl:async()=>html('<meta property="og:title" content="Facebook login">')})).ok,false);
  await assert.rejects(()=>probeEventImage('https://www.facebook.com/events/',{fetchImpl:async()=>{throw Error('must not fetch');}}));
});
test('off-host redirects and oversized bodies stop before using the resource',async()=>{
  let count=0;
  const result=await probeEventImage(event,{fetchImpl:async()=>++count===1?html(meta):new Response('x'.repeat(10*1024*1024+1),{headers:{'content-type':'image/jpeg'}})});
  assert.equal(result.reason,'body-too-large');assert.equal(result.ok,false);
});
test('spoofed MIME, generic logo and off-host redirect do not become success',async()=>{
  assert.equal((await probeEventImage(event,{fetchImpl:async url=>url===event?html(meta):new Response('not an image',{headers:{'content-type':'image/jpeg'}})})).ok,false);
  assert.throws(()=>bridgePhotoUrl('<meta http-equiv="refresh" content="0;url=https://evil.test/photo.php?fbid=123">'));
  const result=await probeEventImage(event,{fetchImpl:async()=>new Response('',{status:302,headers:{location:'https://127.0.0.1/'}})});assert.equal(result.ok,false);
});
