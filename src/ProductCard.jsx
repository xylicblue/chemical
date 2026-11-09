import React from 'react';
import { CATALOGUE_LABELS, isSafeDocument, productFieldVisible, withProductDefaults } from './model.mjs';

function QuoteArrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

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

const factFields = [
  ['grade', 'Available grades'], ['purity', 'Purity / concentration'], ['specifications', 'Specifications'],
  ['packaging', 'Packaging sizes'], ['origin', 'Country of origin'], ['manufacturer', 'Manufacturer'],
  ['minimumOrder', 'Minimum order quantity'], ['applications', 'Applications'], ['cas', 'CAS number']
];
export function ProductInformation({ product, quoteLabel = CATALOGUE_LABELS.quoteLabel, onQuote }) {
  const p = withProductDefaults(product);
  const facts = factFields.filter(([key]) => productFieldVisible(p, key));
  const documents = ['tds', 'sds'].filter(key => productFieldVisible(p, key));
  return <div className="product-information">
    <header className="product-sales-header">
      {productFieldVisible(p, 'category') && <p className="sourcing-category">{p.category}</p>}
      <h3 className="dialog-heading">{p.name}</h3>
      {productFieldVisible(p, 'description') && <p className="detail-description">{p.description}</p>}
      <button type="button" className="button button-dark w-full" disabled={p.demo === true} onClick={() => onQuote(p)}>{p.demo === true ? 'Preview entry only' : quoteLabel}<QuoteArrow/></button>
    </header>
    {facts.length > 0 && <section className="product-buying-details" aria-labelledby={`buying-details-${p.id}`}><h4 id={`buying-details-${p.id}`}>Product & supply details</h4><dl className="specifications product-specifications">{facts.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{p[key]}</dd></div>)}</dl></section>}
    {documents.length > 0 && <><h4 className="product-documents-heading">Product documentation</h4><ProductDocumentation documents={p.documents} types={documents}/></>}
    {productFieldVisible(p, 'note') && <p className="product-note">{p.note}</p>}
  </div>;
}
