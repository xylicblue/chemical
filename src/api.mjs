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
