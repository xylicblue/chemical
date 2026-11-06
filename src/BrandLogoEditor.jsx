import React from 'react';
import { BrandMark } from './Brand.jsx';

export default function BrandLogoEditor({ settings, name, onChange, onUpload, busy }) {
  const change = (key, value) => onChange({ ...settings, [key]: value });
  return (
    <fieldset className="brand-logo-editor" disabled={busy}>
      <legend className="sr-only">Company logo settings</legend>
      <h2 className="editor-group-title">Company logo</h2>
      <p className="brand-logo-help">Choose the mark shown before your company name in the header and footer. Preview your changes, then save or publish as usual.</p>
      <div className="brand-logo-preview" aria-hidden="true"><BrandMark settings={settings} name={name} /><span>{name}</span></div>
      <label className="editor-field"><span>Logo display</span><select value={settings.mode} onChange={e => change('mode', e.target.value)}>
        <option value="initials">Text initials</option><option value="image">Logo image</option><option value="hidden">Hide logo mark</option>
      </select></label>
      {settings.mode !== 'hidden' && <label className="editor-field"><span>{settings.mode === 'image' ? 'Fallback initials' : 'Logo initials'}</span><input value={settings.text} maxLength={3} placeholder="e.g. T or TC" onChange={e => change('text', e.target.value)} /><small>{settings.mode === 'image' ? 'Shown if the image cannot load. Leave blank to use the first letter of your company name.' : 'Enter up to three characters.'}</small></label>}
      {settings.mode === 'image' && <>
        <label className="editor-field"><span>Company logo image URL</span><input type="url" value={settings.image} maxLength={2048} placeholder="https://example.com/logo.png" onChange={e => change('image', e.target.value)} /></label>
        <label className="editor-upload">{busy ? 'Uploading logo...' : 'Upload company logo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} /></label>
        <p className="brand-logo-help">JPG, PNG, or WebP, up to 5 MB. Use a transparent PNG or WebP with light artwork for the navy background. Your image keeps its proportions inside the logo area.</p>
      </>}
    </fieldset>
  );
}
