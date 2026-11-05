import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler,passwordHash,digest } from '../supabase/functions/chemicals-cms/handler.mjs';
import { initialContent } from '../src/content.mjs';
import { clone } from '../src/model.mjs';
const origin='http://127.0.0.1:4173';
function handler(fetcher=()=>{throw Error('Unexpected database access');}){return createHandler({url:'https://project.supabase.co',secret:'test-server-secret',origins:[origin],fetcher});}
const req=(action,method='GET',body,headers={})=>new Request(`https://project.supabase.co/functions/v1/chemicals-cms?action=${action}`,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
test('anonymous visitors cannot read drafts, inquiry data, history, or change content',async()=>{
  const run=handler();for(const [action,method] of [['draft','GET'],['inquiries','GET'],['history','GET'],['save','POST'],['publish','POST'],['upload','POST'],['password','POST']]){const response=await run(req(action,method));assert.equal(response.status,401,action);}
});
test('unapproved browser origins and wrong request methods are rejected',async()=>{
  assert.equal((await handler()(req('content','GET',undefined,{Origin:'https://untrusted.example'}))).status,403);
  assert.equal((await handler()(req('content','POST',{}))).status,405);
  const cors=await handler()(req('content','OPTIONS'));assert.equal(cors.status,204);assert.equal(cors.headers.get('Access-Control-Allow-Origin'),origin);
});
test('public content responses do not include private server credentials',async()=>{
  const run=handler(async url=>{assert.ok(url.includes('/rest/v1/cms_live?'));return Response.json([{content:{brand:{name:'Test'}},revision:1}]);});
  const response=await run(req('content'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{content:{brand:{name:'Test'}},revision:1});
});
test('login enforces its rate limit before checking credentials',async()=>{
  const run=handler(async url=>{assert.ok(url.endsWith('/rpc/cms_take_rate_limit'));return Response.json(false);});
  assert.equal((await run(req('login','POST',{password:'incorrect'}))).status,429);
});
test('passwords use a salted deterministic PBKDF2 derivation',async()=>{
  const a=await passwordHash('example-test-password','salt-a');assert.equal(a.length,64);assert.equal(a,await passwordHash('example-test-password','salt-a'));assert.notEqual(a,await passwordHash('example-test-password','salt-b'));assert.notEqual(a,await digest('example-test-password'));
});

test('authenticated saves persist mixed partner cards and reject unsafe logos before writing', async () => {
  let stored;
  let saves = 0;
  const run = handler(async (url, options) => {
    if (url.includes('/cms_sessions?')) return Response.json([{token_hash:'test', generation:1}]);
    if (url.includes('/cms_settings?')) return Response.json([{generation:1}]);
    if (url.endsWith('/rpc/cms_save_draft')) {
      saves += 1;
      stored = JSON.parse(options.body).p_content;
      return Response.json(6);
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  const headers = {Authorization:`Bearer ${'a'.repeat(64)}`};
  const content = clone(initialContent);
  content.partnerTicker.items[0] = {...content.partnerTicker.items[0], presentation:'logo', logo:'https://example.com/logo.png', logoAlt:'Supplier wordmark'};
  content.partnerTicker.items[1].visible = false;
  const response = await run(req('save','POST',{content,revision:5},headers));
  assert.equal(response.status,200);
  assert.deepEqual(stored.partnerTicker,content.partnerTicker);
  assert.equal(saves,1);
  content.partnerTicker.items[0].logo = 'javascript:alert(1)';
  const rejected = await run(req('save','POST',{content,revision:6},headers));
  assert.equal(rejected.status,400);
  assert.match((await rejected.json()).error,/HTTPS partner logo/);
  assert.equal(saves,1);
});
