import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('dist/studio',{recursive:true});
await copyFile('dist/index.html','dist/studio/index.html');
await writeFile('dist/robots.txt','User-agent: *\nDisallow: /studio/\n');
await writeFile('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/studio/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
