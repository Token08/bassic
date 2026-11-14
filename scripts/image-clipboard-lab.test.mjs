import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {get} from 'node:http';

test('clipboard laboratory exposes only local read-only assets, never filesystem paths or publishing endpoints',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'bassic-image-lab-test-'));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1cAAAAASUVORK5CYII=','base64');
  const file=join(dir,'pixel.png'),manifest=join(dir,'manifest.json');
  await writeFile(file,png);await writeFile(manifest,JSON.stringify([{title:'Isolated QA',file,text:'Do not publish'}]));
  const port=32000+Math.floor(Math.random()*10000);
  const child=spawn(process.execPath,['scripts/image-clipboard-lab.mjs',manifest],{env:{...process.env,BASSIC_IMAGE_LAB_PORT:String(port)},stdio:['ignore','pipe','pipe']});
  try {
    await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Lab exited before listen');}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Lab did not start')),5000);t.unref();})]);
    const origin=`http://127.0.0.1:${port}`;
    const data=await(await fetch(origin+'/manifest')).json();
    assert.deepEqual(data,[{title:'Isolated QA',text:'Do not publish',image:'/images/0'}]);
    assert(!JSON.stringify(data).includes(dir));
    const image=await fetch(origin+'/images/0');assert.equal(image.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
    assert.equal((await fetch(origin+'/images/9')).status,404);
    assert.equal((await fetch(origin+'/manifest',{method:'POST'})).status,403);
    const hostCheck=await new Promise((resolve,reject)=>{get(origin+'/manifest',{headers:{Host:'untrusted.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});
    assert.equal(hostCheck,403);
    const page=await fetch(origin);assert.equal(page.headers.get('cache-control'),'no-store');assert.match(await page.text(),/サーバーからの自動取得成功を示す画面ではありません/);
  } finally {child.kill();if(child.exitCode===null)await once(child,'exit');await rm(dir,{recursive:true,force:true});}
});
