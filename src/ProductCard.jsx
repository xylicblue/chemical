import React from 'react';
import { CATALOGUE_LABELS, isSafeDocument, withProductDefaults } from './model.mjs';

export function documentAvailability(document) {
  if (document.status === 'not-available') return 'Not currently available';
  if (document.status === 'available') return document.url ? 'Available' : 'Available on request';
  return 'Request availability';
}

export function ProductDocumentation({ documents }) {
  return <div className="product-documents">{['tds', 'sds'].map(type => {
    const document = documents[type];
    const label = type.toUpperCase();
    return <div className="product-document" key={type}>
      <div><strong>{label === 'TDS' ? 'Technical Data Sheet (TDS)' : 'Safety Data Sheet (SDS)'}</strong><span>{documentAvailability(document)}</span></div>
      {document.status === 'available' && isSafeDocument(document.url) && <a href={document.url} target="_blank" rel="noopener noreferrer">View {label}<span className="sr-only"> (opens in a new tab)</span></a>}
    </div>;
  })}</div>;
}

export default function ProductCard({ product, labels = CATALOGUE_LABELS, onView, onQuote }) {
  const p = withProductDefaults(product);
  const summary = ['tds', 'sds'].every(type => p.documents[type].status === 'request') ? 'Request availability' :
    ['tds', 'sds'].map(type => `${type.toUpperCase()}: ${documentAvailability(p.documents[type])}`).join(' · ');
  return <article className="sourcing-card" aria-labelledby={`material-${p.id}`}>
    <p className="sourcing-category">{p.category}</p>
    <h3 id={`material-${p.id}`}>{p.name}</h3>
    <p className="sourcing-identity">{p.cas && <span>CAS {p.cas}</span>}{p.formula && <span>{p.formula}</span>}</p>
    {p.formula && <div className="sourcing-formula" aria-hidden="true">{p.formula}</div>}
    <dl className="sourcing-facts">
      {[['Available grades', p.grade || 'Confirm with supplier'], ['Purity / concentration', p.purity || 'Confirm with supplier'],
        ['Packaging', p.packaging || 'On request'], ['Minimum order', p.minimumOrder || 'On request'],
        ['Applications', p.applications || 'Discuss your application'], ['Documentation', summary]].map(([label, value], index) =>
        <div key={label} className={index > 3 ? 'sourcing-fact-wide' : ''}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {p.industries.length > 0 && <ul className="product-industry-tags" aria-label="Product industries">{p.industries.map(industry => <li key={industry}>{industry}</li>)}</ul>}
    <div className="sourcing-actions">
      <button type="button" className="button button-dark" onClick={() => onQuote(p)} aria-label={`${labels.quoteLabel} for ${p.name}`}>{labels.quoteLabel}<span aria-hidden="true">↗</span></button>
      <button type="button" className="sourcing-details" onClick={() => onView(p)} aria-label={`${labels.detailsLabel} for ${p.name}`}>{labels.detailsLabel}</button>
    </div>
  </article>;
}

export function ProductInformation({ product, quoteLabel = CATALOGUE_LABELS.quoteLabel, onQuote }) {
  const p = withProductDefaults(product);
  return <div className="product-information">
    <p className="eyebrow">{p.category}</p>
    <h3 className="dialog-heading">{p.name}</h3>
    <p className="product-detail-identity">{[p.cas && `CAS ${p.cas}`, p.formula].filter(Boolean).join(' · ')}</p>
    {p.formula && <div className="detail-formula" aria-hidden="true">{p.formula}</div>}
    <button type="button" className="button button-dark w-full" onClick={() => onQuote(p)}>{quoteLabel}<span aria-hidden="true">↗</span></button>
    {p.description && <p className="detail-description">{p.description}</p>}
    <dl className="specifications product-specifications">{[
      ['Available grades', p.grade || 'Confirm with supplier'], ['Purity / concentration', p.purity || 'Confirm with supplier'],
      ['Specifications', p.specifications || 'Request full specifications'], ['Packaging sizes', p.packaging || 'On request'],
      ['Country of origin', p.origin || 'Confirm with supplier'], ['Manufacturer', p.manufacturer || 'Confirm with supplier'],
      ['Minimum order quantity', p.minimumOrder || 'On request'], ['Applications', p.applications || 'Discuss your application'],
      ['Industries', p.industries.join(', ') || 'Confirm your application with our team']
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <h4 className="product-documents-heading">Product documentation</h4>
    <ProductDocumentation documents={p.documents} />
    <p className="product-note">{p.note || 'Confirm grade, application suitability, documentation, packaging, and supply terms before ordering.'}</p>
  </div>;
}
