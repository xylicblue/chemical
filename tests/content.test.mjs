import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialContent } from '../src/content.mjs';
import { clone, visibleProducts, categories, validateContent, validateInquiry, isSafeImage } from '../src/model.mjs';

test('catalogue filters search and categories together and never exposes hidden products',()=>{
  const data=clone(initialContent);data.products[0].visible=false;
  assert.equal(visibleProducts(data,'sodium').length,0);
  assert.equal(visibleProducts(data,'67-63-0','Solvents')[0].name,'Isopropyl alcohol');
  assert.equal(visibleProducts(data,'67-63-0','Industrial').length,0);
  assert.equal(visibleProducts(data,'  WATER  ').length,1);
  assert.deepEqual(categories(data),['All materials','Specialty','Solvents','Water & process','Industrial']);
});
test('content validation preserves a valid draft and rejects duplicate identifiers and unsafe images',()=>{
  assert.equal(validateContent(initialContent),initialContent);
  const duplicate=clone(initialContent);duplicate.products[1].id=duplicate.products[0].id;
  assert.throws(()=>validateContent(duplicate),/unique/);
  const unsafe=clone(initialContent);unsafe.hero.image='javascript:alert(1)';assert.throws(()=>validateContent(unsafe),/HTTPS/);
  const dash=clone(initialContent);dash.hero.title='Text\u2014text';assert.throws(()=>validateContent(dash),/em dash/);
  assert.equal(isSafeImage('https://example.com/image.webp'),true);assert.equal(isSafeImage('//example.com/image.png'),false);
});
test('inquiries require explicit consent, a valid email, and bounded content',()=>{
  const valid={name:'Test Person',email:'test@example.com',company:'',product:'',quantity:'',message:'Please discuss this specification.',consent:true};
  assert.equal(validateInquiry(valid).email,'test@example.com');
  assert.throws(()=>validateInquiry({...valid,consent:false}),/agree/);
  assert.throws(()=>validateInquiry({...valid,email:'bad'}),/email/);
  assert.throws(()=>validateInquiry({...valid,message:'a'.repeat(5001)}),/message/);
});
