import React, { useState } from 'react';
import { withProductDefaults } from './model.mjs';

const textFields = [
  ['name', 'Product name', 160], ['category', 'Material category', 100], ['formula', 'Chemical formula'], ['cas', 'CAS number'],
  ['description', 'Product description', 5000, true], ['grade', 'Available grades', 5000, true],
  ['purity', 'Purity / concentration'], ['specifications', 'Relevant specifications', 5000, true],
  ['packaging', 'Available packaging sizes', 5000, true], ['origin', 'Country of origin'], ['manufacturer', 'Manufacturer'],
  ['minimumOrder', 'Minimum order quantity'], ['applications', 'Applications', 5000, true], ['note', 'Product note', 5000, true]
];

export default function ProductEditor({ product, industryOptions, onChange, busy }) {
  const p = withProductDefaults(product);
  const [customIndustry, setCustomIndustry] = useState('');
  const [industryError, setIndustryError] = useState('');
  const options = [...new Set([...industryOptions, ...p.industries])];
  function addIndustry() {
    const value = customIndustry.trim();
    if (!value || value.toLocaleLowerCase() === 'all industries') { setIndustryError('Enter an industry name.'); return; }
    if (options.some(option => option.toLocaleLowerCase() === value.toLocaleLowerCase())) { setIndustryError('Select this industry from the list above.'); return; }
    if (p.industries.length >= 15) { setIndustryError('Choose up to 15 industries per product.'); return; }
    onChange('industries', [...p.industries, value]); setCustomIndustry(''); setIndustryError('');
  }
  function changeDocument(type, key, value) { onChange('documents', { ...p.documents, [type]: { ...p.documents[type], [key]: value } }); }
  return <fieldset className="product-details-editor" disabled={busy}>
    <legend className="sr-only">Product information</legend>
    <p className="product-editor-help">Only publish confirmed grades, specifications, packaging, origin, and supply terms. Blank fields display a request or confirmation message.</p>
    {textFields.map(([key, label, max = 5000, multiline]) => <label className="editor-field" key={key}><span>{label}</span>{multiline ? <textarea value={p[key]} rows={3} maxLength={max} onChange={e => onChange(key, e.target.value)} /> : <input value={p[key]} maxLength={max} onChange={e => onChange(key, e.target.value)} />}{key === 'grade' && <small>For example industrial, food, or pharmaceutical, only where confirmed.</small>}</label>)}
    <label className="editor-toggle"><input type="checkbox" checked={p.visible} onChange={e => onChange('visible', e.target.checked)} /><span>Visible on website</span></label>
    <label className="editor-toggle"><input type="checkbox" checked={p.featured} onChange={e => onChange('featured', e.target.checked)} /><span>Featured material (shown first)</span></label>
    <fieldset className="product-industry-editor"><legend>Industries served</legend><p className="product-editor-help">Assign each product to the industries it supports. Sector tags do not replace confirmation of the supplied grade.</p>
      {options.map(value => <label className="editor-toggle" key={value}><input type="checkbox" checked={p.industries.includes(value)} disabled={!p.industries.includes(value) && p.industries.length >= 15} onChange={e => onChange('industries', e.target.checked ? [...p.industries, value] : p.industries.filter(item => item !== value))} /><span>{value}</span></label>)}
      <label className="editor-field"><span>Additional industry</span><input value={customIndustry} maxLength={80} onChange={e => { setCustomIndustry(e.target.value); setIndustryError(''); }} /></label>
      <button type="button" className="editor-small-button" onClick={addIndustry}>Add industry to product</button>
      {industryError && <p className="form-error" role="alert">{industryError}</p>}
    </fieldset>
    <h2 className="editor-group-title">Product documentation</h2>
    {['tds', 'sds'].map(type => <div className="editor-subcard" key={type}><h3>{type === 'tds' ? 'Technical Data Sheet (TDS)' : 'Safety Data Sheet (SDS)'}</h3>
      <label className="editor-field"><span>{type.toUpperCase()} availability</span><select value={p.documents[type].status} onChange={e => changeDocument(type, 'status', e.target.value)}><option value="request">Request availability</option><option value="available">Available</option><option value="not-available">Not currently available</option></select></label>
      <label className="editor-field"><span>{type.toUpperCase()} document URL</span><input type="url" maxLength={2048} value={p.documents[type].url} placeholder="https://example.com/document.pdf" onChange={e => changeDocument(type, 'url', e.target.value)} /><small>Optional HTTPS link to the current document. A link appears only when availability is set to Available. Without a link, visitors see Available on request.</small></label>
    </div>)}
  </fieldset>;
}
