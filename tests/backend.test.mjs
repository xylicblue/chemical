import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler,passwordHash,digest } from '../supabase/functions/chemicals-cms/handler.mjs';
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
