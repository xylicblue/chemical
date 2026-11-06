import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createSiteContentRequest } from '../src/content-loader.mjs';
import { initialContent } from '../src/content.mjs';
import { clone } from '../src/model.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
function published() {
  const content = clone(initialContent);
  content.brand.name = 'Actual client company';
  content.hero.title = 'The published headline';
  content.hero.image = 'https://example.com/published-image.webp';
  return { content, revision: 23 };
}

test('a slow content request emits no template and reveals only the fetched content', async () => {
  let resolve, signal;
  const ready = [], errors = [];
  const cancel = createSiteContentRequest({
    request: (action, options) => { assert.equal(action, 'content'); signal = options.signal; return new Promise(done => { resolve = done; }); },
    onReady: content => ready.push(content), onError: error => errors.push(error),
  });
  try {
    await tick();
    assert.equal(ready.length, 0);
    assert.equal(errors.length, 0);
    assert.equal(signal.aborted, false);
    const response = published();
    resolve(response);
    await tick();
    assert.equal(ready.length, 1);
    assert.equal(ready[0].brand.name, 'Actual client company');
    assert.equal(ready[0].hero.image, response.content.hero.image);
    assert.equal(errors.length, 0);
  } finally { cancel(); }
});

test('failed and malformed responses produce an error without publishing fallback content', async () => {
  for (const request of [async () => { throw Error('Offline'); }, async () => ({}), async () => ({ content: { brand: { name: 'Incomplete' } } })]) {
    let cancel, readyCount = 0;
    const error = await new Promise(resolve => {
      cancel = createSiteContentRequest({ request, onReady: () => { readyCount++; }, onError: resolve });
    });
    cancel();
    assert.ok(error instanceof Error);
    assert.equal(readyCount, 0);
  }
});

test('an unresponsive request times out once and aborts the underlying fetch', async () => {
  let signal, errorCount = 0, readyCount = 0, cancel;
  await new Promise(resolve => {
    cancel = createSiteContentRequest({ timeoutMs: 10,
      request: (_action, options) => { signal = options.signal; return new Promise(() => {}); },
      onReady: () => { readyCount++; }, onError: error => { assert.match(error.message, /timed out/); errorCount++; resolve(); },
    });
  });
  assert.equal(signal.aborted, true);
  assert.equal(errorCount, 1);
  assert.equal(readyCount, 0);
  cancel();
});

test('unmounted or superseded requests cannot reveal late content or error messages', async () => {
  let resolve, signal, readyCount = 0, errorCount = 0;
  const cancel = createSiteContentRequest({
    request: (_action, options) => { signal = options.signal; return new Promise(done => { resolve = done; }); },
    onReady: () => { readyCount++; }, onError: () => { errorCount++; },
  });
  await tick();
  cancel();
  resolve(published());
  await tick();
  assert.equal(signal.aborted, true);
  assert.equal(readyCount, 0);
  assert.equal(errorCount, 0);
});

test('retry uses a fresh request and can recover after a failed first attempt', async () => {
  const signals = [];
  let attempts = 0, cancel;
  const request = async (_action, { signal }) => { signals.push(signal); if (++attempts === 1) throw Error('Temporary failure'); return published(); };
  await new Promise(resolve => { cancel = createSiteContentRequest({ request, onReady: () => assert.fail('Failed request must not show content'), onError: resolve }); });
  cancel();
  const content = await new Promise((resolve, reject) => { cancel = createSiteContentRequest({ request, onReady: resolve, onError: reject }); });
  cancel();
  assert.equal(attempts, 2);
  assert.notEqual(signals[0], signals[1]);
  assert.equal(content.hero.title, 'The published headline');
});

test('the API client forwards cancellation to fetch', async () => {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
  const controller = new AbortController();
  try {
    globalThis.window = { CHEMICALS_CONFIG: { configured: true, apiUrl: 'https://example.com/content-api' } };
    globalThis.fetch = (_url, options) => {
      assert.equal(options.signal, controller.signal);
      return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
    };
    const { api } = await import('../src/api.mjs?content-loading-test');
    const pending = api('content', { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  }
});

test('initial rendering contains only accessible loading shapes, and explicit Studio content can render immediately', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Boundary } = await vite.ssrLoadModule('/src/SiteContentBoundary.jsx');
    const { SiteLoadError } = await vite.ssrLoadModule('/src/SiteLoadingState.jsx');
    const { default: Image } = await vite.ssrLoadModule('/src/ContentImage.jsx');
    let rendered = false;
    const child = content => { rendered = true; return React.createElement('h1', {}, content.brand.name); };
    const loading = renderToStaticMarkup(React.createElement(Boundary, {}, child));
    assert.equal(rendered, false);
    assert.ok(loading.includes('aria-busy="true"'));
    assert.ok(loading.includes('role="status"'));
    assert.ok(loading.includes('skeleton-hero-image'));
    for (const text of ['Aster', 'Powering Industries', '00+', 'Partner One', '<img', 'example.com']) assert.ok(!loading.includes(text), text);
    const preview = renderToStaticMarkup(React.createElement(Boundary, { previewContent: published().content }, child));
    assert.ok(preview.includes('Actual client company'));
    assert.ok(!preview.includes('skeleton-hero-image'));
    const failure = renderToStaticMarkup(React.createElement(SiteLoadError, { onRetry() {} }));
    assert.ok(failure.includes('Try again'));
    assert.ok(!failure.includes('Aster'));
    const image = renderToStaticMarkup(React.createElement(Image, { src: 'https://example.com/published-image.webp', alt: 'Published artwork', className: 'hero-image', loading: 'lazy' }));
    assert.ok(image.includes('image-loading-mask'));
    assert.ok(image.includes('hero-image content-image'));
    assert.ok(!image.includes('is-ready'));
    assert.ok(image.includes('alt="Published artwork"'));
  } finally { await vite.close(); }
});
