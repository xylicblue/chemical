const config = globalThis.window?.CHEMICALS_CONFIG || {};
export const isConnected = () => Boolean(config.configured && config.apiUrl);
let session = '';
export const clearSession = () => { session = ''; };
export async function api(action, { method = 'GET', body } = {}) {
  if (!isConnected()) throw new Error('The live backend is not connected yet.');
  const headers = { 'Content-Type': 'application/json' };
  if (session) headers.Authorization = `Bearer ${session}`;
  const response = await fetch(`${config.apiUrl}?action=${encodeURIComponent(action)}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  const result = await response.json().catch(() => ({ error: 'The server returned an unexpected response.' }));
  if (!response.ok) { if (response.status === 401) session = ''; const err = new Error(result.error || 'Unable to complete that request.'); err.status = response.status; throw err; }
  if (action === 'login') session = result.token;
  return result;
}
export async function uploadImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return api('upload', { method: 'POST', body: { data: btoa(binary), type: file.type } });
}
