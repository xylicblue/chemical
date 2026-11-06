import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { initialContent } from '../src/content.mjs';
import { clone, createDefaultBrandLogo, withContentDefaults, validateContent } from '../src/model.mjs';
import { createHandler } from '../supabase/functions/chemicals-cms/handler.mjs';

test('older drafts gain editable initials from the company name without replacing brand copy', () => {
  const old = clone(initialContent);
  delete old.brandLogo;
  old.brand.name = 'Tahir';
  const normalized = withContentDefaults(old);
  assert.equal(old.brandLogo, undefined);
  assert.equal(normalized.brand, old.brand);
  assert.deepEqual(normalized.brandLogo, { mode: 'initials', text: 'T', image: '' });
  assert.equal(validateContent(old), old);
  normalized.brandLogo.text = 'TC';
  assert.equal(withContentDefaults(old).brandLogo.text, 'T');
});

test('restoring content preserves custom images, initials, and hidden-logo choices', () => {
  for (const mode of ['image', 'initials', 'hidden']) {
    const content = clone(initialContent);
    content.brandLogo = { mode, text: 'TC', image: 'https://example.com/logo.webp' };
    const restored = withContentDefaults(JSON.parse(JSON.stringify(validateContent(content))));
    assert.deepEqual(restored.brandLogo, content.brandLogo);
  }
});

test('logo validation rejects unsafe images, malformed settings, and incomplete active modes', () => {
  for (const logo of [null, [], { mode: 'unknown', text: 'T', image: '' },
    { mode: 'initials', text: '', image: '' }, { mode: 'initials', text: 'FOUR', image: '' },
    { mode: 'image', text: 'T', image: '' },
    ...['javascript:alert(1)', '//example.com/logo.png', 'data:image/svg+xml,test', 'http://example.com/logo.png'].map(image => ({ mode: 'image', text: 'T', image })),
  ]) assert.throws(() => validateContent({ ...clone(initialContent), brandLogo: logo }), /logo/i);
});

test('authenticated CMS saves preserve the selected company logo without changing wordmark text', async () => {
  const origin = 'http://127.0.0.1:4173';
  let stored;
  const run = createHandler({ url: 'https://project.supabase.co', secret: 'test-secret', origins: [origin], fetcher: async (url, options) => {
    if (url.includes('/cms_sessions?')) return Response.json([{ token_hash: 'test', generation: 1 }]);
    if (url.includes('/cms_settings?')) return Response.json([{ generation: 1 }]);
    assert.ok(url.endsWith('/rpc/cms_save_draft'));
    stored = JSON.parse(options.body).p_content;
    return Response.json(19);
  } });
  const content = clone(initialContent);
  content.brandLogo = { mode: 'image', text: 'TC', image: 'https://example.com/logo.png' };
  const response = await run(new Request('https://project.supabase.co/functions/v1/chemicals-cms?action=save', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Authorization: `Bearer ${'a'.repeat(64)}` },
    body: JSON.stringify({ content, revision: 18 }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(stored.brandLogo, content.brandLogo);
  assert.deepEqual(stored.brand, content.brand);
});

test('header and footer share the editable mark while keeping accessible company text', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Brand } = await vite.ssrLoadModule('/src/Brand.jsx');
    const { default: Editor } = await vite.ssrLoadModule('/src/BrandLogoEditor.jsx');
    const content = clone(initialContent);
    content.brand.name = 'Tahir';
    content.brandLogo = { mode: 'image', text: 'TC', image: 'https://example.com/logo.png' };
    for (const dark of [false, true]) {
      const markup = renderToStaticMarkup(React.createElement(Brand, { content, dark }));
      assert.ok(markup.includes('src="https://example.com/logo.png"'));
      assert.ok(markup.includes('alt=""'));
      assert.ok(markup.includes('aria-label="Tahir CHEMICALS home"'));
      assert.ok(markup.includes('Tahir<small>CHEMICALS</small>'));
    }
    const render = settings => renderToStaticMarkup(React.createElement(Brand, { content: { ...content, brandLogo: settings } }));
    assert.ok(render({ ...content.brandLogo, mode: 'initials', text: 'TC' }).includes('>TC</span>'));
    assert.ok(!render({ ...content.brandLogo, mode: 'hidden' }).includes('brand-mark'));
    assert.ok(!render({ ...content.brandLogo, image: 'javascript:alert(1)' }).includes('<img'));
    const editor = renderToStaticMarkup(React.createElement(Editor, { settings: content.brandLogo, name: 'Tahir', onChange() {}, onUpload() {}, busy: false }));
    for (const label of ['Logo display', 'Upload company logo', 'Company logo image URL', 'Fallback initials', 'Hide logo mark']) assert.ok(editor.includes(label), label);
    assert.equal(createDefaultBrandLogo('Tahir').text, 'T');
  } finally { await vite.close(); }
});
