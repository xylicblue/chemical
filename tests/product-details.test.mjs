import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { initialContent } from '../src/content.mjs';
import { clone, isSafeDocument, productIndustryOptions, validateContent, visibleProducts, withContentDefaults, withProductDefaults } from '../src/model.mjs';
import { createHandler } from '../supabase/functions/chemicals-cms/handler.mjs';

const additionalFields = ['purity', 'specifications', 'origin', 'manufacturer', 'minimumOrder', 'industries', 'documents'];

test('legacy products and backups gain optional sourcing details without changing supplied facts', () => {
  const old = clone(initialContent);
  for (const product of old.products) for (const field of additionalFields) delete product[field];
  const before = clone(old);
  const content = withContentDefaults(old);
  assert.deepEqual(old, before);
  assert.equal(validateContent(old), old);
  assert.equal(validateContent(content), content);
  for (let i = 0; i < old.products.length; i++) {
    for (const key of Object.keys(old.products[i])) assert.deepEqual(content.products[i][key], old.products[i][key]);
    assert.equal(content.products[i].documents.tds.status, 'request');
    assert.equal(content.products[i].purity, '');
    assert.equal(content.products[i].origin, '');
  }
  assert.deepEqual(content.products[0].industries, ['Industrial']);
  assert.deepEqual(content.products.find(p => p.id === 'hydrogen-peroxide').industries, ['Textiles']);
  assert.ok(!content.products.some(p => p.industries.includes('Pharmaceuticals') || p.industries.includes('Food')));
  content.products[0].documents.tds.status = 'available';
  assert.equal(withContentDefaults(old).products[0].documents.tds.status, 'request');
});

test('industry, category, and sourcing searches intersect while hidden products stay private', () => {
  const content = clone(initialContent);
  const p = content.products[0];
  p.industries = ['Pharmaceuticals', 'Food'];
  p.grade = 'Example confirmed grade';
  p.purity = 'Example 99.5%';
  p.origin = 'Example origin';
  p.manufacturer = 'Example manufacturer';
  for (const query of ['99.5%', 'Example origin', 'Example manufacturer', 'confirmed grade', 'Pharmaceuticals']) {
    assert.deepEqual(visibleProducts(content, query, p.category, 'Food').map(item => item.id), [p.id]);
  }
  assert.equal(visibleProducts(content, 'Example manufacturer', p.category, 'Textiles').length, 0);
  assert.equal(visibleProducts(content, 'Example manufacturer', 'Solvents', 'Food').length, 0);
  p.visible = false;
  p.industries.push('Private custom sector');
  assert.equal(visibleProducts(content, 'Example manufacturer', 'All materials', 'Food').length, 0);
  assert.ok(!productIndustryOptions(content).includes('Private custom sector'));
  assert.ok(productIndustryOptions(content, true).includes('Private custom sector'));
});

test('sourcing data validates and survives backup restoration exactly as entered', () => {
  const content = clone(initialContent);
  Object.assign(content.products[0], {
    grade: 'Example industrial grade', purity: 'Example concentration', specifications: 'Example specification\nSecond line',
    packaging: 'Example 25 kg bags', origin: 'Example country', manufacturer: 'Example manufacturer', minimumOrder: 'Example 100 kg',
    industries: ['Industrial', 'Example custom sector'], documents: { tds: { status: 'available', url: 'https://example.com/tds.pdf?version=2' }, sds: { status: 'request', url: '' } }
  });
  const restored = withContentDefaults(JSON.parse(JSON.stringify(validateContent(content))));
  assert.deepEqual(restored.products[0], content.products[0]);
});

test('sourcing validation rejects malformed industries, document states, unsafe links, and oversized fields', () => {
  for (const industries of [null, 'Food', ['Food', 'food'], [' All industries '], [''], ['Food '], Array.from({ length: 16 }, (_, i) => `Sector ${i}`)]) {
    const content = clone(initialContent); content.products[0].industries = industries;
    assert.throws(() => validateContent(content), /industr|sector/i);
  }
  for (const url of ['javascript:alert(1)', 'data:application/pdf,test', '//example.com/test.pdf', 'http://example.com/test.pdf', 'https://example.com/"bad.pdf']) {
    const content = clone(initialContent); content.products[0].documents.tds = { status: 'available', url };
    assert.equal(isSafeDocument(url), false);
    assert.throws(() => validateContent(content), /document|TDS/);
  }
  for (const documents of [null, [], { tds: { status: 'available', url: '' } }, { tds: { status: 'approved', url: '' }, sds: { status: 'request', url: '' } }]) {
    const content = clone(initialContent); content.products[0].documents = documents;
    assert.throws(() => validateContent(content), /documentation|availability/);
  }
  const oversized = clone(initialContent); oversized.products[0].specifications = 'x'.repeat(5001);
  assert.throws(() => validateContent(oversized), /specifications/);
  assert.equal(isSafeDocument('https://example.com/current.pdf?token=example'), true);
});

test('authenticated CMS saves preserve nested sourcing details and reject unsafe documents before writing', async () => {
  let stored, saves = 0;
  const origin = 'http://127.0.0.1:4173';
  const run = createHandler({ url: 'https://project.supabase.co', secret: 'test-secret', origins: [origin], fetcher: async (url, options) => {
    if (url.includes('/cms_sessions?')) return Response.json([{ token_hash: 'test', generation: 1 }]);
    if (url.includes('/cms_settings?')) return Response.json([{ generation: 1 }]);
    assert.ok(url.endsWith('/rpc/cms_save_draft'));
    saves++; stored = JSON.parse(options.body).p_content;
    return Response.json(19);
  } });
  const content = clone(initialContent);
  Object.assign(content.products[0], { purity: 'Example 99%', origin: 'Example country', minimumOrder: 'Example 100 kg', industries: ['Food'] });
  content.products[0].documents.tds = { status: 'available', url: 'https://example.com/tds.pdf' };
  const request = () => new Request('https://project.supabase.co/functions/v1/chemicals-cms?action=save', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Authorization: `Bearer ${'a'.repeat(64)}` }, body: JSON.stringify({ content, revision: 18 }),
  });
  assert.equal((await run(request())).status, 200);
  assert.deepEqual(stored.products[0], content.products[0]);
  content.products[0].documents.sds.url = 'javascript:alert(1)';
  assert.equal((await run(request())).status, 400);
  assert.equal(saves, 1);
});

test('cards, product details, editor controls, and sector filters expose sourcing facts without claiming unknown availability', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Card, ProductInformation, ProductDocumentation } = await vite.ssrLoadModule('/src/ProductCard.jsx');
    const { default: Editor } = await vite.ssrLoadModule('/src/ProductEditor.jsx');
    const { default: Catalogue } = await vite.ssrLoadModule('/src/ProductCatalogue.jsx');
    const p = withProductDefaults(initialContent.products[0]);
    const card = renderToStaticMarkup(React.createElement(Card, { product: p, onView() {}, onQuote() {} }));
    for (const label of ['Available grades', 'Purity / concentration', 'Packaging', 'Minimum order', 'Applications', 'Documentation', 'Request availability', 'Request a quotation']) assert.ok(card.includes(label), label);
    assert.ok(card.includes('<article'));
    assert.ok(!card.includes('<button class="product-card"'));
    const detail = renderToStaticMarkup(React.createElement(ProductInformation, { product: p, onQuote() {} }));
    for (const label of ['Specifications', 'Country of origin', 'Manufacturer', 'Minimum order quantity', 'Technical Data Sheet (TDS)', 'Safety Data Sheet (SDS)', 'Confirm with supplier']) assert.ok(detail.includes(label), label);
    assert.ok(!detail.includes('href='));
    const documents = { tds: { status: 'available', url: 'https://example.com/tds.pdf' }, sds: { status: 'request', url: 'https://example.com/unconfirmed.pdf' } };
    const docs = renderToStaticMarkup(React.createElement(ProductDocumentation, { documents }));
    assert.ok(docs.includes('href="https://example.com/tds.pdf"'));
    assert.ok(docs.includes('rel="noopener noreferrer"'));
    assert.ok(!docs.includes('unconfirmed.pdf'));
    const editor = renderToStaticMarkup(React.createElement(Editor, { product: p, industryOptions: productIndustryOptions(initialContent, true), onChange() {}, busy: false }));
    for (const label of ['Available grades', 'Purity / concentration', 'Relevant specifications', 'Available packaging sizes', 'Country of origin', 'Manufacturer', 'Minimum order quantity', 'TDS availability', 'SDS availability', 'Pharmaceuticals', 'Cosmetics', 'Food', 'Textiles', 'Industrial']) assert.ok(editor.includes(label), label);
    const catalogue = renderToStaticMarkup(React.createElement(Catalogue, { content: initialContent, onView() {}, onQuote() {} }));
    assert.ok(catalogue.includes('Browse by industry'));
    assert.ok(catalogue.includes('aria-pressed="true">All industries'));
  } finally { await vite.close(); }
});
