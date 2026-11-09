import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { initialContent } from '../src/content.mjs';
import { categories, clone, isSafeDocument, productIndustryOptions, validateContent, visibleProducts, withContentDefaults, withProductDefaults } from '../src/model.mjs';
import { productPage, productPageNumbers, PRODUCTS_PER_PAGE } from '../src/product-list.mjs';
import { catalogueWithSamples } from '../src/catalogue-demo.mjs';
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

test('category and sourcing searches exclude hidden facts, legacy industry tags, and hidden products', () => {
  const content = clone(initialContent);
  const p = content.products[0];
  p.industries = ['Pharmaceuticals', 'Food'];
  p.grade = 'Example confirmed grade';
  p.purity = 'Example 99.5%';
  p.origin = 'Example origin';
  p.manufacturer = 'Example manufacturer';
  for (const query of ['99.5%', 'Example origin', 'Example manufacturer', 'confirmed grade']) {
    assert.deepEqual(visibleProducts(content, query, p.category).map(item => item.id), [p.id]);
  }
  assert.equal(visibleProducts(content, 'Pharmaceuticals').length, 0);
  assert.equal(visibleProducts(content, 'Example manufacturer', 'Solvents').length, 0);
  p.fieldVisibility = { manufacturer: false };
  assert.equal(visibleProducts(content, 'Example manufacturer').length, 0);
  assert.deepEqual(categories({ products: [{ ...p, fieldVisibility: { category: false } }] }), ['All materials']);
  p.visible = false;
  p.industries.push('Private custom sector');
  assert.equal(visibleProducts(content, 'Example origin').length, 0);
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
  Object.assign(content.products[0], { purity: 'Example 99%', origin: 'Example country', minimumOrder: 'Example 100 kg', industries: ['Food'], fieldVisibility: { grade: false, origin: false, tds: true, sds: false } });
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

test('landing-page products show names only with compact name search and no industry divisions', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { ProductInformation, ProductDocumentation } = await vite.ssrLoadModule('/src/ProductCard.jsx');
    const { default: Editor } = await vite.ssrLoadModule('/src/ProductEditor.jsx');
    const { default: Catalogue } = await vite.ssrLoadModule('/src/ProductCatalogue.jsx');
    const p = withProductDefaults(initialContent.products[0]);
    const detail = renderToStaticMarkup(React.createElement(ProductInformation, { product: p, onQuote() {} }));
    assert.ok(!detail.includes(p.formula));
    assert.ok(detail.includes(p.cas));
    for (const label of ['Available grades', 'Technical Data Sheet (TDS)', 'Safety Data Sheet (SDS)']) assert.ok(detail.includes(label), label);
    for (const blankField of ['Specifications', 'Country of origin', 'Manufacturer', 'Minimum order quantity', 'Confirm with supplier']) assert.ok(!detail.includes(blankField));
    assert.ok(!detail.includes('href='));
    const documents = { tds: { status: 'available', url: 'https://example.com/tds.pdf' }, sds: { status: 'request', url: 'https://example.com/unconfirmed.pdf' } };
    const docs = renderToStaticMarkup(React.createElement(ProductDocumentation, { documents }));
    assert.ok(docs.includes('href="https://example.com/tds.pdf"'));
    assert.ok(docs.includes('rel="noopener noreferrer"'));
    assert.ok(!docs.includes('unconfirmed.pdf'));
    const editor = renderToStaticMarkup(React.createElement(Editor, { product: p, onChange() {}, busy: false }));
    for (const label of ['Available grades', 'Purity / concentration', 'Relevant specifications', 'Available packaging sizes', 'Country of origin', 'Manufacturer', 'Minimum order quantity', 'TDS availability', 'SDS availability', 'Show available grades on website', 'Show SDS availability on website']) assert.ok(editor.includes(label), label);
    assert.ok(!editor.includes('Industries served'));
    assert.ok(!editor.includes('Chemical formula'));
    const catalogue = renderToStaticMarkup(React.createElement(Catalogue, { content: initialContent, onView() {} }));
    assert.ok(catalogue.includes('Our products'));
    assert.ok(catalogue.includes('product-name-grid'));
    assert.ok(catalogue.includes('type="search"'));
    assert.ok(catalogue.includes('Search products by name'));
    assert.equal((catalogue.match(/aria-haspopup="dialog"/g) || []).length, initialContent.products.length);
    for (const product of initialContent.products) {
      assert.ok(catalogue.includes(product.name));
      assert.ok(!catalogue.includes(product.description));
      assert.ok(!catalogue.includes(product.formula));
      assert.ok(!catalogue.includes(product.cas));
    }
    assert.ok(!catalogue.includes('Product pages'));
    for (const html of [catalogue, detail]) {
      for (const removed of ['Search for more materials', 'Browse by industry', 'All industries', 'product-industry-tags', 'material-pill', '<select']) assert.ok(!html.includes(removed), removed);
    }
  } finally { await vite.close(); }
});

test('optional field settings survive backups and reject malformed visibility values', () => {
  const content = clone(initialContent);
  const product = content.products[0];
  product.fieldVisibility = { grade: false, purity: false, tds: true, sds: false };
  const restored = withContentDefaults(JSON.parse(JSON.stringify(validateContent(content))));
  assert.deepEqual(restored.products[0], product);
  assert.equal(product.grade, restored.products[0].grade);
  for (const value of [null, [], 'hidden', { grade: 'false' }, { name: false }, { industries: true }]) {
    const invalid = clone(content); invalid.products[0].fieldVisibility = value;
    assert.throws(() => validateContent(invalid), /visibility/);
  }
  for (const key of ['grade', 'purity', 'specifications', 'packaging', 'origin', 'manufacturer', 'minimumOrder', 'applications', 'note', 'formula', 'cas', 'description', 'documents']) delete product[key];
  assert.doesNotThrow(() => validateContent(content));
  assert.doesNotThrow(() => validateContent(withContentDefaults(content)));
});

test('pagination includes every visible product exactly once, preserves Studio order, and clamps stale pages', () => {
  const products = Array.from({ length: 33 }, (_, index) => ({ ...initialContent.products[0], id: 'test-' + index, name: 'Product ' + index, featured: index % 2 === 0, visible: index % 5 !== 0 }));
  const before = clone(products);
  const expected = products.filter(product => product.visible);
  const pages = Array.from({ length: Math.ceil(expected.length / PRODUCTS_PER_PAGE) }, (_, index) => productPage(products, index + 1));
  assert.deepEqual(pages.flatMap(page => page.items), expected);
  assert.ok(pages.every(page => page.items.length <= 12));
  assert.equal(pages[0].start, 1);
  assert.equal(pages[0].end, 12);
  assert.equal(pages.at(-1).end, expected.length);
  assert.equal(productPage(products, 999).page, pages.length);
  for (const invalid of [0, -1, NaN, Infinity]) assert.equal(productPage(products, invalid).page, 1);
  assert.deepEqual(products, before);
  assert.deepEqual(productPage([]), { items: [], page: 1, pageCount: 1, total: 0, start: 0, end: 0 });
  assert.equal(productPage(products.map(product => ({ ...product, visible: false })), 9).total, 0);
  for (let current = 1; current <= 42; current++) {
    const numbers = productPageNumbers(current, 42);
    assert.equal(numbers[0], 1);
    assert.equal(numbers.at(-1), 42);
    assert.ok(numbers.includes(current));
    assert.ok(numbers.length <= 9);
    assert.equal(new Set(numbers.filter(Boolean)).size, numbers.filter(Boolean).length);
  }
});

test('the product directory renders bounded pages, meaningful navigation, empty states, and editable copy', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Catalogue } = await vite.ssrLoadModule('/src/ProductCatalogue.jsx');
    const content = clone(initialContent);
    content.catalogue.listingTitle = 'Client product collection';
    content.products = Array.from({ length: 25 }, (_, index) => ({ ...content.products[0], id: 'product-' + index, name: 'Listing item ' + String(index).padStart(2, '0') }));
    const html = renderToStaticMarkup(React.createElement(Catalogue, { content, onView() {} }));
    assert.ok(html.includes('Client product collection'));
    assert.ok(html.includes('Showing 1 to 12 of 25 products'));
    assert.equal((html.match(/class="product-name-link"/g) || []).length, 12);
    assert.ok(!html.includes('Listing item 12'));
    assert.ok(html.includes('aria-label="Product pages"'));
    assert.ok(html.includes('aria-current="page"'));
    assert.ok(html.includes('disabled=""'));
    assert.ok(html.includes('type="search"'));
    content.products = [];
    const empty = renderToStaticMarkup(React.createElement(Catalogue, { content, onView() {} }));
    assert.ok(empty.includes('Contact our team'));
    assert.ok(!empty.includes('aria-label="Product pages"'));
  } finally { await vite.close(); }
});

test('name search filters the entire catalogue before pagination and keeps hidden products excluded', () => {
  const products = Array.from({ length: 31 }, (_, index) => ({ ...initialContent.products[0], id: `match-${index}`, name: `Test material ${index}`, category: 'Not a name match', visible: index !== 7 }));
  const before = clone(products);
  const first = productPage(products, 1, '  TEST MATERIAL  ');
  const last = productPage(products, 999, 'test material');
  assert.equal(first.total, 30);
  assert.equal(first.items.length, 12);
  assert.equal(last.page, 3);
  assert.equal(last.items.length, 6);
  assert.equal(productPage(products, 1, 'Not a name match').total, 0);
  assert.equal(productPage(products, 1, 'Test material 7').total, 0);
  assert.equal(productPage(products, 1, 'nothing matches').pageCount, 1);
  assert.equal(productPage(products, 1, '').total, 30);
  assert.deepEqual(products, before);
});

test('pagination preview adds labelled sample entries without changing real products or enabling sample quotes', async () => {
  const before = clone(initialContent.products);
  const products = catalogueWithSamples(initialContent.products);
  assert.deepEqual(initialContent.products, before);
  assert.equal(products.length, initialContent.products.length + 24);
  assert.ok(productPage(products).pageCount >= 3);
  const sample = products.find(product => product.demo === true);
  const restored = clone(initialContent); restored.products = products;
  assert.doesNotThrow(() => validateContent(restored));
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Catalogue } = await vite.ssrLoadModule('/src/ProductCatalogue.jsx');
    const { ProductInformation } = await vite.ssrLoadModule('/src/ProductCard.jsx');
    const demo = renderToStaticMarkup(React.createElement(Catalogue, { content: initialContent, demo: true, onView() {} }));
    const normal = renderToStaticMarkup(React.createElement(Catalogue, { content: initialContent, onView() {} }));
    assert.ok(demo.includes('Pagination preview'));
    assert.ok(demo.includes('aria-label="Product pages"'));
    assert.ok(!normal.includes('Pagination preview'));
    assert.ok(!normal.includes(sample.name));
    const detail = renderToStaticMarkup(React.createElement(ProductInformation, { product: sample, onQuote() {} }));
    assert.ok(detail.includes('Preview entry only'));
    assert.ok(detail.includes('disabled=""'));
    assert.ok(detail.includes('does not confirm stock'));
    assert.deepEqual(initialContent.products, before);
  } finally { await vite.close(); }
});

test('per-material visibility hides saved facts and documents in the detail modal without discarding values', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { ProductInformation } = await vite.ssrLoadModule('/src/ProductCard.jsx');
    const p = withProductDefaults({ ...initialContent.products[0], grade: 'Private grade', purity: 'Private purity', origin: 'Private origin', documents: { tds: { status: 'available', url: 'https://example.com/private-tds.pdf' }, sds: { status: 'available', url: 'https://example.com/sds.pdf' } }, fieldVisibility: { grade: false, purity: false, origin: false, tds: false, sds: true } });
    const before = clone(p);
    for (const Component of [ProductInformation]) {
      const html = renderToStaticMarkup(React.createElement(Component, { product: p, onView() {}, onQuote() {} }));
      for (const value of ['Private grade', 'Private purity', 'Private origin', 'private-tds.pdf', 'Technical Data Sheet']) assert.ok(!html.includes(value));
      assert.ok(html.includes('SDS'));
    }
    const restored = { ...p, fieldVisibility: { ...p.fieldVisibility, grade: true, tds: true } };
    const html = renderToStaticMarkup(React.createElement(ProductInformation, { product: restored, onQuote() {} }));
    assert.ok(html.includes('Private grade'));
    assert.ok(html.includes('https://example.com/private-tds.pdf'));
    assert.deepEqual(p, before);
  } finally { await vite.close(); }
});
