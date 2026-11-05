import { createHandler } from './handler.mjs';
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
Deno.serve(createHandler({
  url: Deno.env.get('SUPABASE_URL') || '',
  secret: secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  origins: [
    'https://tahirchemicals.netlify.app',
    'https://aster-chemicals-studio.bufffinch1.chatgpt.site',
    'http://127.0.0.1:4173',
    'http://localhost:4173'
  ]
}));
