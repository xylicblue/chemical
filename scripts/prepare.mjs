import {copyFile} from 'node:fs/promises';
await copyFile(new URL('../src/model.mjs',import.meta.url),new URL('../supabase/functions/chemicals-cms/model.mjs',import.meta.url));
