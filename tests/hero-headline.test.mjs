import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { initialContent } from '../src/content.mjs';
import { clone, validateContent, withContentDefaults } from '../src/model.mjs';

test('legacy hero copy and image settings are preserved when adding the accent field', () => {
  const content = clone(initialContent);
  delete content.hero.highlight;
  const original = clone(content.hero);
  const result = withContentDefaults(content);
  assert.equal(content.hero.highlight, undefined);
  assert.equal(result.hero.highlight, '');
  for (const key of Object.keys(original)) assert.equal(result.hero[key], original[key]);
  assert.equal(validateContent(content), content);
  assert.equal(validateContent(result), result);
  const invalid = clone(initialContent); invalid.hero.highlight = 'x'.repeat(241);
  assert.throws(() => validateContent(invalid), /accent phrase/);
});

test('the hero highlights an exact phrase while preserving line breaks and escaping headline content', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { default: Headline } = await vite.ssrLoadModule('/src/HeroHeadline.jsx');
    const render = (title, highlight) => renderToStaticMarkup(React.createElement(Headline, { title, highlight }));
    assert.equal(render('Good chemistry.\nClear supply.', 'Clear supply.'), '<h1>Good chemistry.<br/><span class="hero-highlight">Clear supply.</span></h1>');
    assert.equal(render('Good chemistry.\nClear supply.', ''), '<h1>Good chemistry.<br/>Clear supply.</h1>');
    assert.equal(render('Good chemistry.', 'Different headline'), '<h1>Good chemistry.</h1>');
    assert.equal(render('Supply & support', 'Supply & support'), '<h1><span class="hero-highlight">Supply &amp; support</span></h1>');
    assert.ok(render('Safe <script>text</script>', '<script>').includes('&lt;script&gt;'));
    assert.ok(!render('Safe <script>text</script>', '<script>').includes('<script>'));
  } finally { await vite.close(); }
});
