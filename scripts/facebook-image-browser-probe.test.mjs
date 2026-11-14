import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectCover} from './facebook-image-browser-probe.mjs';
const candidate=(id='123',src='https://scontent.ffuk2-1.fna.fbcdn.net/poster.jpg')=>({href:`https://www.facebook.com/photo/?fbid=${id}`,src,width:960,height:536});
test('selects only the exact photo identity, ignores recommendations and unrelated logos',()=>{
  const expected=candidate();
  assert.deepEqual(selectCover([candidate('999'),{...candidate(),width:32,height:32},candidate('123','https://static.xx.fbcdn.net/logo.jpg'),expected],'123'),expected);
});
test('duplicates of the same photo URI are accepted, competing photos fail closed',()=>{
  assert.equal(selectCover([candidate(),candidate()],'123').width,960);
  assert.throws(()=>selectCover([candidate(),candidate('123','https://scontent.ffuk2-1.fna.fbcdn.net/other.jpg')],'123'),/ambiguous/);
});
test('missing identity, mismatched photo, foreign hosts, credentialed URLs and undecoded placeholders fail closed',()=>{
  assert.throws(()=>selectCover([candidate()],''));
  for(const item of [candidate('999'),candidate('123','https://127.0.0.1/image.jpg'),candidate('123','https://user:pass@scontent.ffuk2-1.fna.fbcdn.net/photo.jpg'),{...candidate(),width:0}, {...candidate(),href:'https://evil.example/photo/?fbid=123'}])assert.throws(()=>selectCover([item],'123'));
});
