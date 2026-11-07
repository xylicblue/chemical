import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createDefaultPartnerTicker } from '../src/model.mjs';

test('partner presentation handles visibility, text/logo fallback, and accessible duplicate scrolling cards', async () => {
  const vite = await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  try {
    const {default: Ticker} = await vite.ssrLoadModule('/src/PartnerTicker.jsx');
    const {default: Editor} = await vite.ssrLoadModule('/src/PartnerTickerEditor.jsx');
    const settings = createDefaultPartnerTicker();
    const render = value => renderToStaticMarkup(React.createElement(Ticker,{settings:value}));
    assert.equal(render({...settings,enabled:false}),'');
    assert.equal(render({...settings,items:[]}),'');
    assert.equal(render({...settings,items:settings.items.map(item=>({...item,visible:false}))}),'');
    const one = render({...settings,items:[settings.items[0]]});
    assert.ok(one.includes('partners-static'));
    assert.ok(!one.includes('Pause movement'));
    const full = render(settings);
    assert.ok(!full.includes('Pause movement'));
    assert.ok(!full.includes('Resume movement'));
    const accessible = full.match(/<ul class="sr-only">(.*?)<\/ul>/s)[1];
    assert.equal((accessible.match(/Partner One/g)||[]).length,1);
    const logo = {...settings.items[0],presentation:'logo',logo:'https://example.com/logo.png'};
    assert.ok(render({...settings,items:[logo]}).includes('src="https://example.com/logo.png"'));
    const missing = render({...settings,items:[{...logo,logo:''}]});
    assert.ok(missing.includes('partner-card-name'));
    assert.ok(!missing.includes('<img'));
    const malicious = render({...settings,items:[{...settings.items[0],name:'<img src=x onerror=alert(1)>'}]});
    assert.ok(malicious.includes('&lt;img'));
    assert.ok(!malicious.includes('<img src=x'));
    const editor = renderToStaticMarkup(React.createElement(Editor,{settings:{...settings,items:[logo]},onChange(){},onUploadLogo(){},busy:false}));
    for (const label of ['Display as','Logo image URL','Upload partner logo','Visible on website','Movement speed','Direction']) assert.ok(editor.includes(label),label);
  } finally { await vite.close(); }
});
