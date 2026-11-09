import React, { useEffect, useRef, useState } from 'react';
import { PRODUCT_LIST_COPY, productPage, productPageNumbers } from './product-list.mjs';
import { catalogueWithSamples } from './catalogue-demo.mjs';

function PageArrow({ previous = false }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={previous ? 'M20 12H5m6-6-6 6 6 6' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function ProductCatalogue({ content, onView, demo = false }) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const section = useRef(null);
  const heading = useRef(null);
  const c = { ...PRODUCT_LIST_COPY, ...content.catalogue };
  const products = demo ? catalogueWithSamples(content.products) : content.products;
  const result = productPage(products, page, query);
  useEffect(() => { setPage(current => Math.min(current, result.pageCount)); }, [result.pageCount]);

  function changePage(next) {
    setPage(Math.max(1, Math.min(next, result.pageCount)));
    heading.current?.focus({ preventScroll: true });
    section.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function search(value) { setQuery(value); setPage(1); }

  return <section ref={section} className="catalogue-section product-list-section" id="products" aria-labelledby="catalogue-title"><div className="shell">
    <header className="catalogue-heading"><div><p className="eyebrow">{c.eyebrow}</p><h2 ref={heading} tabIndex={-1} id="catalogue-title">{c.listingTitle}</h2></div><p>{c.listingDescription}</p></header>
    {demo && <div className="product-demo-note" role="status"><p><strong>Pagination preview</strong> · Includes sample products for testing. Sample entries cannot send quote requests.</p><a href="/#products">Exit preview</a></div>}
    <div className="product-directory">
    <div className="product-list-toolbar"><div><p className="product-directory-label">Product directory</p><p className="product-list-count" aria-live="polite" aria-atomic="true">{result.total ? `Showing ${result.start} to ${result.end} of ${result.total} ${query.trim() ? 'matching ' : ''}${result.total === 1 ? 'product' : 'products'}` : query.trim() ? 'No products match your search' : 'No products to display'}</p></div>
      <label className="product-list-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span className="sr-only">Search products by name</span><input type="search" value={query} onChange={event => search(event.target.value)} placeholder="Search products" aria-label="Search products by name"/></label>
    </div>
    {result.total > 0 ? <ul className="product-name-grid">{result.items.map((product, index) => <li key={product.id}><button type="button" className="product-name-link" onClick={() => onView(product)} aria-haspopup="dialog" aria-label={`${product.name}, view product details`}><span className="product-name-copy"><span className="product-name-index" aria-hidden="true">{String(result.start + index).padStart(2, '0')}</span><span className="product-name-title">{product.name}</span></span><span className="product-name-arrow"><PageArrow/></span></button></li>)}</ul> : <div className="empty-state"><h3>{query.trim() ? 'No matching products' : c.listingEmptyTitle}</h3><p>{query.trim() ? 'Try another product name or clear your search.' : c.listingEmptyText}</p>{query.trim() ? <button type="button" className="button button-dark" onClick={() => search('')}>Clear search</button> : <a className="button button-dark" href="#contact">Contact our team<PageArrow/></a>}</div>}
    {result.pageCount > 1 && <nav className="product-pagination" aria-label="Product pages">
      <button type="button" className="product-page-direction" disabled={result.page === 1} onClick={() => changePage(result.page - 1)}><PageArrow previous/><span>Previous</span></button>
      <div className="product-page-numbers">{productPageNumbers(result.page, result.pageCount).map((number, index) => number === null ? <span className="product-page-gap" key={`gap-${index}`} aria-hidden="true">…</span> : <button type="button" key={number} aria-label={`Page ${number}`} aria-current={number === result.page ? 'page' : undefined} onClick={() => changePage(number)}>{number}</button>)}</div>
      <button type="button" className="product-page-direction" disabled={result.page === result.pageCount} onClick={() => changePage(result.page + 1)}><span>Next</span><PageArrow/></button>
    </nav>}
    </div>
  </div></section>;
}
