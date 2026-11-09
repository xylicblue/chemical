import React from 'react';
import { withProductDefaults } from './model.mjs';

const textFields = [
  ['name', 'Product name', 160], ['category', 'Material category', 100], ['cas', 'CAS number'],
  ['description', 'Product description', 5000, true], ['grade', 'Available grades', 5000, true],
  ['purity', 'Purity / concentration'], ['specifications', 'Relevant specifications', 5000, true],
  ['packaging', 'Available packaging sizes', 5000, true], ['origin', 'Country of origin'], ['manufacturer', 'Manufacturer'],
  ['minimumOrder', 'Minimum order quantity'], ['applications', 'Applications', 5000, true], ['note', 'Product note', 5000, true]
];

export default function ProductEditor({ product, onChange, busy }) {
  const p = withProductDefaults(product);
  const shown = key => p.fieldVisibility[key] !== false;
  function toggle(key, value) { onChange('fieldVisibility', { ...p.fieldVisibility, [key]: value }); }
  function changeDocument(type, key, value) { onChange('documents', { ...p.documents, [type]: { ...p.documents[type], [key]: value } }); }
  return <fieldset className="product-details-editor" disabled={busy}>
    <legend className="sr-only">Product information</legend>
    <p className="product-editor-help">The website lists product names in your Studio order, with 12 products per page. Visitors open a product to see its description and enabled details. Use Move up and Move down to change the order. Blank details stay hidden, and turning a field off preserves its saved value.</p>
    {textFields.map(([key, label, max = 5000, multiline]) => <div className="product-field-editor" key={key}>
      <label className="editor-field"><span>{label}{!['name', 'category'].includes(key) && <small className="product-optional-label">Optional</small>}</span>{multiline ? <textarea value={p[key]} rows={3} maxLength={max} onChange={e => onChange(key, e.target.value)}/> : <input value={p[key]} maxLength={max} onChange={e => onChange(key, e.target.value)}/>}{key === 'grade' && <small>For example industrial, food, or pharmaceutical, only where confirmed.</small>}</label>
      {key !== 'name' && <label className="editor-toggle product-field-toggle"><input type="checkbox" checked={shown(key)} onChange={e => toggle(key, e.target.checked)}/><span>Show {label.toLowerCase()} on website</span></label>}
    </div>)}
    <label className="editor-toggle"><input type="checkbox" checked={p.visible} onChange={e => onChange('visible', e.target.checked)}/><span>Visible on website</span></label>
    <h2 className="editor-group-title">Product documentation</h2>
    {['tds', 'sds'].map(type => <div className="editor-subcard" key={type}><h3>{type === 'tds' ? 'Technical Data Sheet (TDS)' : 'Safety Data Sheet (SDS)'}</h3>
      <label className="editor-toggle"><input type="checkbox" checked={shown(type)} onChange={e => toggle(type, e.target.checked)}/><span>Show {type.toUpperCase()} availability on website</span></label>
      <label className="editor-field"><span>{type.toUpperCase()} availability</span><select value={p.documents[type].status} onChange={e => changeDocument(type, 'status', e.target.value)}><option value="request">Request availability</option><option value="available">Available</option><option value="not-available">Not currently available</option></select></label>
      <label className="editor-field"><span>{type.toUpperCase()} document URL</span><input type="url" maxLength={2048} value={p.documents[type].url} placeholder="https://example.com/document.pdf" onChange={e => changeDocument(type, 'url', e.target.value)}/><small>Optional HTTPS link. A link appears only when this field is shown and availability is set to Available.</small></label>
    </div>)}
  </fieldset>;
}
