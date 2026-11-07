import React, { useEffect, useRef, useState } from 'react';
import { CATALOGUE_LABELS, MATERIAL_BROWSE_LABELS, categories, visibleProducts } from './model.mjs';
import { popularMaterialRows } from './material-browse.mjs';
import MaterialPills from './MaterialPills.jsx';
import ProductCard, { ProductInformation } from './ProductCard.jsx';

export default function ProductCatalogue({ content, onView, onSearch }) {
  const c = { ...MATERIAL_BROWSE_LABELS, ...content.catalogue };
  const rows = popularMaterialRows(content);
  return <section className="catalogue-section popular-materials" id="products" aria-labelledby="catalogue-title"><div className="shell">
    <div className="catalogue-heading"><div><p className="eyebrow">{c.eyebrow}</p><h2 id="catalogue-title">{c.popularTitle}</h2></div><p>{c.description}</p></div>
    {rows.length > 0 && <div className="material-pill-rows">{rows.map((products, i) => <MaterialPills products={products} key={i} onView={onView}/>)}</div>}
    <button type="button" className="material-search-entry" onClick={onSearch} aria-haspopup="dialog">
      <span><strong>{c.searchTitle}</strong><span>{c.searchDescription}</span></span>
      <span className="material-search-entry-action">Browse collection <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg></span>
    </button>
  </div></section>;
}

export function MaterialSearch({ content, onQuote }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All materials');
  const [selected, setSelected] = useState(null);
  const heading = useRef(null);
  const firstRender = useRef(true);
  const c = { ...CATALOGUE_LABELS, ...MATERIAL_BROWSE_LABELS, ...content.catalogue };
  const products = visibleProducts(content, query, category);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    heading.current?.focus();
  }, [selected]);
  function clearFilters() { setQuery(''); setCategory('All materials'); }
  return <div className="material-search-panel">
    <div ref={heading} tabIndex={-1} className="material-search-panel-heading">
      {selected ? <><button type="button" className="material-search-back" onClick={() => setSelected(null)}>← Back to search results</button><p className="sr-only">Material details: {selected.name}</p></> : <><p className="eyebrow">{c.eyebrow}</p><h3 className="dialog-heading">{c.searchTitle}</h3><p className="dialog-description">{c.searchDescription}</p></>}
    </div>
    {selected ? <ProductInformation product={selected} quoteLabel={c.quoteLabel} onQuote={onQuote}/> : <>
      <div className="catalogue-toolbar sourcing-toolbar">
        <label className="search-field"><span className="sr-only">{c.searchPlaceholder}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a material" aria-label={c.searchPlaceholder}/></label>
        <label className="catalogue-category-filter"><span>Material category</span><select value={category} onChange={e => setCategory(e.target.value)}>{categories(content).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      <div className="catalogue-results"><p className="results-count" aria-live="polite">{products.length} {products.length === 1 ? 'material' : 'materials'}{query && ` matching “${query}”`}</p>{(query || category !== 'All materials') && <button type="button" className="text-link" onClick={clearFilters}>Clear filters</button>}</div>
      <div className="sourcing-grid">{products.map(product => <ProductCard key={product.id} product={product} labels={c} onView={setSelected} onQuote={onQuote}/>)}</div>
      {!products.length && <div className="empty-state"><h3>{c.emptyTitle}</h3><p>{c.emptyText}</p><button type="button" className="button button-dark" onClick={() => onQuote({})}>{c.quoteLabel}</button></div>}
    </>}
  </div>;
}
