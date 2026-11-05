import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialContent } from '../src/content.mjs';
import { clone, createDefaultPartnerTicker, withContentDefaults, validateContent } from '../src/model.mjs';
import { uploadImage } from '../src/api.mjs';

test('old drafts and restored versions gain partner settings without mutating existing content', () => {
  const old = clone(initialContent);
  delete old.partnerTicker;
  old.brand.name = 'Client company';
  const normalized = withContentDefaults(old);
  assert.equal(old.partnerTicker, undefined);
  assert.equal(normalized.brand, old.brand);
  assert.equal(normalized.brand.name, 'Client company');
  assert.equal(normalized.partnerTicker.items.length, 6);
  assert.equal(validateContent(old), old);
  assert.equal(validateContent(normalized), normalized);
  normalized.partnerTicker.items[0].name = 'Changed';
  assert.equal(withContentDefaults(old).partnerTicker.items[0].name, 'Partner One');
});

test('saved logo and text settings retain visibility, order, and movement preferences', () => {
  const content = clone(initialContent);
  content.partnerTicker = {
    ...createDefaultPartnerTicker(), speed: 'standard', direction: 'right',
    items: [
      { id: 'custom-logo', name: 'Confirmed partner', presentation: 'logo', logo: 'https://example.com/logo.webp', logoAlt: 'Confirmed partner wordmark', visible: true },
      { id: 'custom-text', name: 'Text partner', presentation: 'text', logo: '', logoAlt: '', visible: false }
    ]
  };
  const restored = withContentDefaults(JSON.parse(JSON.stringify(validateContent(content))));
  assert.deepEqual(restored.partnerTicker, content.partnerTicker);
  assert.equal(restored.partnerTicker.items[0].presentation, 'logo');
  const hidden = clone(content); hidden.partnerTicker.enabled = false;
  assert.equal(withContentDefaults(hidden).partnerTicker.enabled, false);
});

test('partner validation rejects unsafe URLs, duplicate identities, malformed entries, and unsupported movement values', () => {
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/logo.png', 'http://example.com/logo.png']) {
    const content = clone(initialContent); content.partnerTicker.items[0].logo = url;
    assert.throws(() => validateContent(content), /HTTPS partner logo/);
  }
  const duplicate = clone(initialContent); duplicate.partnerTicker.items[1].id = duplicate.partnerTicker.items[0].id;
  assert.throws(() => validateContent(duplicate), /unique/);
  const oversized = clone(initialContent); oversized.partnerTicker.items = Array.from({length: 41}, (_, i) => ({...oversized.partnerTicker.items[0], id:`partner-${i}`}));
  assert.throws(() => validateContent(oversized), /40/);
  for (const [key, value] of [['speed', 'unlimited'], ['direction', 'diagonal'], ['enabled', 'yes'], ['moving', 1]]) {
    const invalid = clone(initialContent); invalid.partnerTicker[key] = value;
    assert.throws(() => validateContent(invalid), /partner ticker/);
  }
  const empty = clone(initialContent); empty.partnerTicker.items[0].name = '';
  assert.throws(() => validateContent(empty), /partner name/);
});

test('logo uploads reject unsupported formats and oversized files before contacting the backend', async () => {
  await assert.rejects(uploadImage({type:'image/svg+xml', size:100}), /JPG, PNG, or WebP/);
  await assert.rejects(uploadImage({type:'image/png', size:5242881}), /smaller than 5 MB/);
});
