import { validateContent, validateInquiry } from './model.mjs';
const encoder = new TextEncoder();
export const hex = value => [...new Uint8Array(value)].map(b=>b.toString(16).padStart(2,'0')).join('');
export const digest = async value => hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:210000},key,256));}
const equal = (a,b) => {if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export function createHandler({url,secret,origins,fetcher=fetch,now=()=>new Date()}){
  async function db(path,{method='GET',body,prefer='return=representation'}={}){
    const headers={apikey:secret,'Content-Type':'application/json',Prefer:prefer};if(secret?.startsWith('eyJ'))headers.Authorization=`Bearer ${secret}`;
    const response=await fetcher(`${url}/rest/v1/${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new HttpError(502,'The content service returned an unexpected response.');}
    if(!response.ok){if(data?.message?.includes('DRAFT_CONFLICT'))throw new HttpError(409,'Another editor saved a newer draft. Download a backup of your changes, then load the saved draft before continuing.');throw new HttpError(502,'The content service could not complete this request.');}return data;
  }
  const settings=async()=>{const data=await db('cms_settings?id=eq.true&select=*');if(!data?.[0])throw new HttpError(503,'The content studio has not been configured.');return data[0];};
  const rate=async(key,limit,seconds)=>{const allowed=await db('rpc/cms_take_rate_limit',{method:'POST',body:{p_key:key,p_limit:limit,p_seconds:seconds}});if(allowed!==true)throw new HttpError(429,'Too many requests. Please wait before trying again.');};
  async function readBody(req,max=800000){if(Number(req.headers.get('content-length'))>max)throw new HttpError(413,'This request is too large.');const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Request data is required.');let chunks=[],size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'This request is too large.');}chunks.push(value);}const data=new Uint8Array(size);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}try{return JSON.parse(new TextDecoder().decode(data));}catch{throw new HttpError(400,'The request data is invalid.');}}
  const needPassword=password=>{if(typeof password!=='string'||password.length<14||password.length>128)throw new HttpError(400,'Choose an editor password between 14 and 128 characters.');};
  return async function handler(req){
    const origin=req.headers.get('origin');const cors={'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Max-Age':'600','Vary':'Origin','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
    if(origin&&origins.includes(origin))cors['Access-Control-Allow-Origin']=origin;
    const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
    try{
      if(origin&&!origins.includes(origin))throw new HttpError(403,'This website origin is not allowed.');
      if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
      if(!url||!secret)throw new HttpError(503,'The content service is not configured.');
      const action=new URL(req.url).searchParams.get('action')||'content';
      const readActions=['content','status','draft','inquiries','history'];
      if(req.method!==(readActions.includes(action)?'GET':'POST'))throw new HttpError(405,'This request method is not supported.');
      if(action==='content'){const data=await db('cms_live?id=eq.true&select=content,revision,updated_at');if(!data?.[0])throw new HttpError(503,'Website content is being prepared.');return respond(data[0]);}
      if(action==='status'){const config=await settings();return respond({initialized:Boolean(config.password_hash)});}
      const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const ipHash=await digest(`chemicals:${ip}`);
      if(['login','setup','inquiry'].includes(action)){
        const body=await readBody(req,20000);
        if(action==='inquiry'){
          if(typeof body.website==='string'&&body.website.trim())return respond({ok:true});
          await rate(`inquiry:${ipHash}`,5,900);await rate('inquiry-global',500,86400);
          const valid=validateInquiry(body);await db('cms_inquiries',{method:'POST',body:valid});return respond({ok:true});
        }
        await rate(`login:${ipHash}`,8,900);await rate('login-global',200,3600);
        const config=await settings();
        if(action==='setup'){
          if(config.password_hash)throw new HttpError(409,'The editor password has already been set.');
          if(typeof body.code!=='string'||body.code.length>200||!config.bootstrap_hash||new Date(config.bootstrap_expires)<=now()||!equal(await digest(body.code),config.bootstrap_hash))throw new HttpError(401,'The setup code is invalid or has expired.');
          needPassword(body.password);const salt=random();const hash=await passwordHash(body.password,salt);
          const changed=await db('cms_settings?id=eq.true&password_hash=is.null',{method:'PATCH',body:{password_hash:hash,password_salt:salt,bootstrap_hash:null,bootstrap_expires:null,updated_at:now().toISOString()}});
          if(!changed.length)throw new HttpError(409,'The editor has already been set up.');return respond({ok:true});
        }
        if(typeof body.password!=='string'||body.password.length>128||!config.password_hash||!equal(await passwordHash(body.password,config.password_salt),config.password_hash))throw new HttpError(401,'The editor password is incorrect.');
        const token=random();await db('cms_sessions',{method:'POST',body:{token_hash:await digest(token),expires_at:new Date(now().getTime()+8*3600000).toISOString(),generation:config.generation}});
        await db(`cms_sessions?expires_at=lt.${encodeURIComponent(now().toISOString())}`,{method:'DELETE'});
        await db(`cms_rate_limits?expires_at=lt.${encodeURIComponent(now().toISOString())}`,{method:'DELETE'});
        return respond({token});
      }
      const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
      if(!token||!/^[a-f0-9]{64}$/.test(token))throw new HttpError(401,'Open the content studio with your editor password to continue.');
      const tokenHash=await digest(token);const sessions=await db(`cms_sessions?token_hash=eq.${tokenHash}&expires_at=gt.${encodeURIComponent(now().toISOString())}&select=token_hash,generation`);
      const activeSettings=await settings();if(!sessions.length||sessions[0].generation!==activeSettings.generation)throw new HttpError(401,'Your editor session has expired. Please open the studio again.');
      if(action==='draft'){const [draft,live]=await Promise.all([db('cms_draft?id=eq.true&select=content,revision'),db('cms_live?id=eq.true&select=revision')]);return respond({...draft[0],liveRevision:live[0].revision});}
      if(action==='inquiries')return respond({items:await db('cms_inquiries?select=*&order=created_at.desc&limit=200')});
      if(action==='history')return respond({items:await db('cms_history?select=id,revision,created_at&order=revision.desc&limit=30')});
      if(action==='logout'){await db(`cms_sessions?token_hash=eq.${tokenHash}`,{method:'DELETE'});return respond({ok:true});}
      const body=await readBody(req,action==='upload'?7100000:800000);
      if(action==='save'){validateContent(body.content);if(!Number.isSafeInteger(body.revision)||body.revision<1)throw new HttpError(400,'The draft version is invalid.');const revision=await db('rpc/cms_save_draft',{method:'POST',body:{p_content:body.content,p_revision:body.revision}});return respond({revision});}
      if(action==='publish'){if(!Number.isSafeInteger(body.revision)||body.revision<1)throw new HttpError(400,'The draft version is invalid.');const draft=await db('cms_draft?id=eq.true&select=content');validateContent(draft[0].content);return respond(await db('rpc/cms_publish_draft',{method:'POST',body:{p_revision:body.revision}}));}
      if(action==='history-item'){if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/.test(body.id))throw new HttpError(400,'The version identifier is invalid.');const items=await db(`cms_history?id=eq.${body.id}&select=content`);if(!items.length)throw new HttpError(404,'This version is no longer available.');return respond(items[0]);}
      if(action==='inquiry-status'){if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/.test(body.id)||!['new','reviewed'].includes(body.status))throw new HttpError(400,'The inquiry status is invalid.');await db(`cms_inquiries?id=eq.${body.id}`,{method:'PATCH',body:{status:body.status}});return respond({ok:true});}
      if(action==='password'){needPassword(body.password);const config=await settings();if(typeof body.current!=='string'||body.current.length>128||!equal(await passwordHash(body.current,config.password_salt),config.password_hash))throw new HttpError(401,'The current password is incorrect.');const salt=random();await db('cms_settings?id=eq.true',{method:'PATCH',body:{password_hash:await passwordHash(body.password,salt),password_salt:salt,generation:config.generation+1,updated_at:now().toISOString()}});await db('cms_sessions?token_hash=not.is.null',{method:'DELETE'});return respond({ok:true});}
      if(action==='upload'){
        const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
        if(!types[body.type]||typeof body.data!=='string'||body.data.length>7000000||!/^[a-zA-Z0-9+/]*={0,2}$/.test(body.data))throw new HttpError(400,'Choose a JPG, PNG, or WebP image smaller than 5 MB.');
        let bytes;try{bytes=Uint8Array.from(atob(body.data),c=>c.charCodeAt(0));}catch{throw new HttpError(400,'The image data is invalid.');}
        if(bytes.length>5242880||bytes.length<12)throw new HttpError(400,'The image must be smaller than 5 MB.');
        const valid=body.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:body.type==='image/png'?hex(bytes.slice(0,8))==='89504e470d0a1a0a':new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
        if(!valid)throw new HttpError(400,'This file does not match the selected image format.');
        const name=`${crypto.randomUUID()}.${types[body.type]}`;const headers={apikey:secret,'Content-Type':body.type};if(secret.startsWith('eyJ'))headers.Authorization=`Bearer ${secret}`;
        const result=await fetcher(`${url}/storage/v1/object/website-images/${name}`,{method:'POST',headers,body:bytes});if(!result.ok)throw new HttpError(502,'The image could not be uploaded.');return respond({url:`${url}/storage/v1/object/public/website-images/${name}`});
      }
      throw new HttpError(404,'This action does not exist.');
    }catch(err){return respond({error:err.status?err.message:err instanceof Error&&/Please|Enter|Choose|Check|Product|Content|Use |Missing|Website|catalogue|industry|product|principle|step|headline|company|material|No /i.test(err.message)?err.message:'Unable to complete this request. Please try again.'},err.status||400);}
  };
}
