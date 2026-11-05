import React, { useState } from 'react';
import { PartnerCard } from './PartnerTicker.jsx';

export default function PartnerTickerEditor({ settings, onChange, onUploadLogo, busy }) {
  const [removing, setRemoving] = useState('');
  const change = (key, value) => onChange({ ...settings, [key]: value });
  const editPartner = (id, values) => change('items', settings.items.map(item => item.id === id ? { ...item, ...values } : item));
  function move(index, offset) {
    const items = [...settings.items];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    change('items', items);
  }
  function add() {
    change('items', [...settings.items, { id: `partner-${crypto.randomUUID()}`, name: 'New partner', presentation: 'text', logo: '', logoAlt: '', visible: true }]);
  }

  return (
    <fieldset className="partner-editor" disabled={busy}>
      <legend className="sr-only">Supply partner ticker settings</legend>
      <p className="partner-editor-help">Show your confirmed supply partners as names, logos, or a mix of both. These changes follow the same save and publish process as the rest of your website.</p>
      <label className="editor-toggle"><input type="checkbox" checked={settings.enabled} onChange={e => change('enabled', e.target.checked)} /><span>Show supply partner section</span></label>
      <label className="editor-field"><span>Section heading</span><input maxLength={120} value={settings.heading} onChange={e => change('heading', e.target.value)} /><small>Leave blank to hide the heading.</small></label>
      <label className="editor-field"><span>Supporting note</span><textarea rows={2} maxLength={500} value={settings.note} onChange={e => change('note', e.target.value)} /><small>Optional. Remove the sample note after adding your confirmed partners.</small></label>
      <label className="editor-toggle"><input type="checkbox" checked={settings.moving} onChange={e => change('moving', e.target.checked)} /><span>Continuous scrolling</span></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="editor-field"><span>Movement speed</span><select value={settings.speed} onChange={e => change('speed', e.target.value)}><option value="slow">Slow and subtle</option><option value="standard">Standard</option><option value="fast">Faster</option></select></label>
        <label className="editor-field"><span>Direction</span><select value={settings.direction} onChange={e => change('direction', e.target.value)}><option value="left">Move left</option><option value="right">Move right</option></select></label>
      </div>
      <p className="partner-editor-help">Visitors can pause movement. Reduced-motion preferences show a still, horizontally scrollable list. A single visible partner stays still.</p>
      <div className="partner-editor-heading"><h2>Partner cards</h2><span>{settings.items.length} / 40</span></div>
      {settings.items.length === 0 && <p className="editor-empty">No partners added. The section stays hidden until you add a visible partner.</p>}
      {settings.items.map((partner, index) => (
        <article className="editor-subcard" key={partner.id}>
          <div className="editor-subcard-heading">
            <strong>{partner.name || `Partner ${index + 1}`}</strong>
            <div>
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${partner.name} up`}>Up</button>
              <button type="button" disabled={index === settings.items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${partner.name} down`}>Down</button>
              <button type="button" onClick={() => setRemoving(partner.id)}>Remove</button>
            </div>
          </div>
          {removing === partner.id && <div className="partner-remove-confirm"><p>Remove this partner from the draft?</p><div><button type="button" className="editor-small-button" onClick={() => setRemoving('')}>Keep partner</button><button type="button" className="editor-small-button" onClick={() => { change('items', settings.items.filter(item => item.id !== partner.id)); setRemoving(''); }}>Remove partner</button></div></div>}
          <div className="partner-editor-preview" aria-hidden="true"><PartnerCard partner={partner} /></div>
          <label className="editor-field"><span>Partner name</span><input value={partner.name} maxLength={160} onChange={e => editPartner(partner.id, { name: e.target.value })} /><small>Also identifies this partner for screen readers.</small></label>
          <label className="editor-field"><span>Display as</span><select value={partner.presentation} onChange={e => editPartner(partner.id, { presentation: e.target.value })}><option value="text">Text name</option><option value="logo">Logo image</option></select></label>
          {partner.presentation === 'logo' && <>
            <label className="editor-field"><span>Logo image URL</span><input type="url" value={partner.logo} maxLength={2048} placeholder="https://example.com/partner-logo.png" onChange={e => editPartner(partner.id, { logo: e.target.value })} /><small>Paste an HTTPS image URL, or upload a file below.</small></label>
            <label className="editor-upload">Upload partner logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => onUploadLogo(e, partner.id)} /></label>
            <p className="partner-editor-help">JPG, PNG, or WebP, up to 5 MB. Transparent PNG or WebP works best. If a logo cannot load, the partner name is shown.</p>
            <label className="editor-field"><span>Logo description</span><input value={partner.logoAlt} maxLength={240} placeholder={`${partner.name} logo`} onChange={e => editPartner(partner.id, { logoAlt: e.target.value })} /></label>
            {partner.logo && <button type="button" className="editor-small-button partner-clear-logo" onClick={() => editPartner(partner.id, { logo: '', logoAlt: '', presentation: 'text' })}>Remove logo and use text</button>}
          </>}
          <label className="editor-toggle"><input type="checkbox" checked={partner.visible} onChange={e => editPartner(partner.id, { visible: e.target.checked })} /><span>Visible on website</span></label>
        </article>
      ))}
      <button type="button" className="editor-small-button" disabled={settings.items.length >= 40} onClick={add}>Add partner</button>
    </fieldset>
  );
}
