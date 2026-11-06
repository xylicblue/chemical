import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { initialContent } from '../src/content.mjs';
import { clone, createDefaultHeroStats, withContentDefaults, validateContent } from '../src/model.mjs';
import { createHandler } from '../supabase/functions/chemicals-cms/handler.mjs';

test('older content gains independent statistic defaults without replacing client copy', () => {
  const old = clone(initialContent);
  delete old.heroStats;
  old.intro.title = 'Our client headline';
  old.intro.pillars.push({ title: 'Another benefit', text: 'Client details.' });
  const normalized = withContentDefaults(old);
  assert.equal(old.heroStats, undefined);
  assert.equal(normalized.intro, old.intro);
  assert.equal(normalized.intro.title, 'Our client headline');
  assert.equal(normalized.heroStats.items.length, 4);
  assert.ok(normalized.heroStats.items.every(item => item.value === '00+'));
  normalized.heroStats.items[0].value = '70+';
  assert.equal(withContentDefaults(old).heroStats.items[0].value, '00+');
  assert.equal(validateContent(old), old);
});

test('statistic settings preserve exact figures, labels, order, and hidden state on restore', () => {
  const content = clone(initialContent);
  content.heroStats = { enabled: false, heading: 'Company figures', items: [
    { value: '1,200+', label: 'Products' }, { value: '70+', label: 'Years of experience' },
  ] };
  const restored = withContentDefaults(JSON.parse(JSON.stringify(validateContent(content))));
  assert.deepEqual(restored.heroStats, content.heroStats);
});

test('statistic validation rejects malformed settings and unbounded content', () => {
  for (const stats of [null, [], { ...createDefaultHeroStats(), enabled: 'yes' },
    { ...createDefaultHeroStats(), items: Array(5).fill({ value: '1', label: 'Example' }) },
    { ...createDefaultHeroStats(), items: [null] },
    { ...createDefaultHeroStats(), items: [{ value: 70, label: 'Years' }] },
    { ...createDefaultHeroStats(), items: [{ value: 'x'.repeat(21), label: 'Years' }] },
    { ...createDefaultHeroStats(), items: [{ value: '70+', label: '' }] },
  ]) {
    assert.throws(() => validateContent({ ...clone(initialContent), heroStats: stats }), /statistic/i);
  }
});

test('authenticated draft saves retain editable statistic values in the CMS payload', async () => {
  const origin = 'http://127.0.0.1:4173';
  let stored;
  const run = createHandler({ url: 'https://project.supabase.co', secret: 'test-secret', origins: [origin], fetcher: async (url, options) => {
    if (url.includes('/cms_sessions?')) return Response.json([{ token_hash: 'test', generation: 1 }]);
    if (url.includes('/cms_settings?')) return Response.json([{ generation: 1 }]);
    assert.ok(url.endsWith('/rpc/cms_save_draft'));
    stored = JSON.parse(options.body).p_content;
    return Response.json(7);
  } });
  const content = clone(initialContent);
  content.heroStats.items[0] = { value: '70+', label: 'Years of experience' };
  const response = await run(new Request('https://project.supabase.co/functions/v1/chemicals-cms?action=save', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Authorization: `Bearer ${'a'.repeat(64)}` },
    body: JSON.stringify({ content, revision: 6 }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(stored.heroStats, content.heroStats);
  assert.deepEqual(stored.intro, content.intro);
});

test('statistics and company cards render editable content accessibly without duplicating it', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Stats } = await vite.ssrLoadModule('/src/HeroStats.jsx');
    const { default: Editor } = await vite.ssrLoadModule('/src/HeroStatsEditor.jsx');
    const { default: Company } = await vite.ssrLoadModule('/src/CompanySection.jsx');
    const settings = createDefaultHeroStats();
    const render = value => renderToStaticMarkup(React.createElement(Stats, { settings: value }));
    assert.equal(render({ ...settings, enabled: false }), '');
    assert.equal(render({ ...settings, items: [] }), '');
    const stats = render({ ...settings, items: [{ value: '70+', label: 'Years <strong>served</strong>' }] });
    assert.ok(stats.includes('<dl'));
    assert.ok(stats.includes('70<span>+</span>'));
    assert.ok(stats.includes('Years &lt;strong&gt;served&lt;/strong&gt;'));
    assert.equal((stats.match(/<dt>/g) || []).length, 1);
    const editor = renderToStaticMarkup(React.createElement(Editor, { settings, onChange() {}, busy: false }));
    for (const label of ['Show hero statistics', 'Number or figure', 'Statistic label', 'Add statistic', 'Remove statistic 1']) assert.ok(editor.includes(label), label);
    const content = { ...initialContent.intro, pillars: Array.from({ length: 6 }, (_, i) => ({ title: `Client benefit ${i + 1}`, text: `Detail ${i + 1}` })) };
    const company = renderToStaticMarkup(React.createElement(Company, { content }));
    assert.equal((company.match(/<article/g) || []).length, 6);
    for (const item of content.pillars) assert.ok(company.includes(item.title));
    assert.ok(company.includes('aria-labelledby="company-title"'));
  } finally { await vite.close(); }
});
