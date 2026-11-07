import React from 'react';
import { CATALOGUE_LABELS, isSafeDocument, productFieldVisible, withProductDefaults } from './model.mjs';

export function documentAvailability(document) {
  if (document.status === 'not-available') return 'Not currently available';
  if (document.status === 'available') return document.url ? 'Available' : 'Available on request';
  return 'Request availability';
}

export function ProductDocumentation({ documents, types = ['tds', 'sds'] }) {
  return <div className="product-documents">{types.map(type => {
    const document = documents[type];
    const label = type.toUpperCase();
    return <div className="product-document" key={type}>
      <div><strong>{type === 'tds' ? 'Technical Data Sheet (TDS)' : 'Safety Data Sheet (SDS)'}</strong><span>{documentAvailability(document)}</span></div>
      {document.status === 'available' && isSafeDocument(document.url) && <a href={document.url} target="_blank" rel="noopener noreferrer">View {label}<span className="sr-only"> (opens in a new tab)</span></a>}
    </div>;
  })}</div>;
}

function ProductIdentity({ product: p, detail = false }) {
  const values = [productFieldVisible(p, 'cas') && `CAS ${p.cas}`, productFieldVisible(p, 'formula') && p.formula].filter(Boolean);
  return values.length > 0 && <p className={detail ? 'product-detail-identity' : 'sourcing-identity'}>{values.map(value => <span key={value}>{value}</span>)}</p>;
}

const factFields = [
  ['grade', 'Available grades'], ['purity', 'Purity / concentration'], ['specifications', 'Specifications'],
  ['packaging', 'Packaging sizes'], ['origin', 'Country of origin'], ['manufacturer', 'Manufacturer'],
  ['minimumOrder', 'Minimum order quantity'], ['applications', 'Applications']
];

export default function ProductCard({ product, labels = CATALOGUE_LABELS, onView, onQuote }) {
  const p = withProductDefaults(product);
  const facts = factFields.filter(([key]) => productFieldVisible(p, key));
  const documents = ['tds', 'sds'].filter(key => productFieldVisible(p, key));
  return <article className="sourcing-card" aria-labelledby={`material-${p.id}`}>
    {productFieldVisible(p, 'category') && <p className="sourcing-category">{p.category}</p>}
    <h3 id={`material-${p.id}`}>{p.name}</h3>
    <ProductIdentity product={p}/>
    {productFieldVisible(p, 'formula') && <div className="sourcing-formula" aria-hidden="true">{p.formula}</div>}
    {(facts.length > 0 || documents.length > 0) && <dl className="sourcing-facts">
      {facts.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{p[key]}</dd></div>)}
      {documents.length > 0 && <div className="sourcing-fact-wide"><dt>Documentation</dt><dd>{documents.map(type => `${type.toUpperCase()}: ${documentAvailability(p.documents[type])}`).join(' · ')}</dd></div>}
    </dl>}
    <div className="sourcing-actions">
      <button type="button" className="button button-dark" onClick={() => onQuote(p)} aria-label={`${labels.quoteLabel} for ${p.name}`}>{labels.quoteLabel}<span aria-hidden="true">↗</span></button>
      <button type="button" className="sourcing-details" onClick={() => onView(p)} aria-label={`${labels.detailsLabel} for ${p.name}`}>{labels.detailsLabel}</button>
    </div>
  </article>;
}

export function ProductInformation({ product, quoteLabel = CATALOGUE_LABELS.quoteLabel, onQuote }) {
  const p = withProductDefaults(product);
  const facts = factFields.filter(([key]) => productFieldVisible(p, key));
  const documents = ['tds', 'sds'].filter(key => productFieldVisible(p, key));
  return <div className="product-information">
    {productFieldVisible(p, 'category') && <p className="eyebrow">{p.category}</p>}
    <h3 className="dialog-heading">{p.name}</h3>
    <ProductIdentity product={p} detail/>
    {productFieldVisible(p, 'formula') && <div className="detail-formula" aria-hidden="true">{p.formula}</div>}
    <button type="button" className="button button-dark w-full" onClick={() => onQuote(p)}>{quoteLabel}<span aria-hidden="true">↗</span></button>
    {productFieldVisible(p, 'description') && <p className="detail-description">{p.description}</p>}
    {facts.length > 0 && <dl className="specifications product-specifications">{facts.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{p[key]}</dd></div>)}</dl>}
    {documents.length > 0 && <><h4 className="product-documents-heading">Product documentation</h4><ProductDocumentation documents={p.documents} types={documents}/></>}
    {productFieldVisible(p, 'note') && <p className="product-note">{p.note}</p>}
  </div>;
}
