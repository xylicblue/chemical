import { api } from './api.mjs';
import { validateContent, withContentDefaults } from './model.mjs';

export function createSiteContentRequest({ onReady, onError, request = api, timeoutMs = 15000 }) {
  const controller = new AbortController();
  let finished = false;
  const finish = (callback, value) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    callback(value);
  };
  const timer = setTimeout(() => {
    finish(onError, new Error('Website content request timed out.'));
    controller.abort();
  }, timeoutMs);
  Promise.resolve().then(() => {
    if (finished) return;
    return request('content', { signal: controller.signal });
  }).then(response => {
    if (finished) return;
    validateContent(response?.content);
    finish(onReady, withContentDefaults(response.content));
  }).catch(error => finish(onError, error));
  return () => {
    finished = true;
    clearTimeout(timer);
    controller.abort();
  };
}
