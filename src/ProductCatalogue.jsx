import React, { useState } from 'react';
import { CATALOGUE_LABELS, categories, productIndustryOptions, visibleProducts } from './model.mjs';
import ProductCard from './ProductCard.jsx';

export default function ProductCatalogue({ content, onView, onQuote }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All materials');
  const [industry, setIndustry] = useState('All industries');
  const c = { ...CATALOGUE_LABELS, ...content.catalogue };
  const products = visibleProducts(content, query, category, industry);
  const industries = productIndustryOptions(content);
  function clearFilters() { setQuery(''); setCategory('All materials'); setIndustry('All industries'); }
  return <section className="catalogue-section" id="products" aria-labelledby="catalogue-title"><div className="shell">
    <div className="catalogue-heading"><div><p className="eyebrow">{c.eyebrow}</p><h2 id="catalogue-title">{c.title}</h2></div><p>{c.description}</p></div>
    <div className="catalogue-industry-filter"><p>{c.industryFilterLabel}</p><div className="industry-filter-tabs" role="group" aria-label={c.industryFilterLabel}>
      {['All industries', ...industries].map(value => <button type="button" key={value} className={`industry-filter-tab${industry === value ? ' active' : ''}`} aria-pressed={industry === value} onClick={() => setIndustry(value)}>{value === 'All industries' ? c.allIndustriesLabel : value}</button>)}
    </div></div>
    <div className="catalogue-toolbar sourcing-toolbar">
      <label className="catalogue-category-filter"><span>Material category</span><select value={category} onChange={e => setCategory(e.target.value)}>{categories(content).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="search-field"><span className="sr-only">{c.searchPlaceholder}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a material" aria-label={c.searchPlaceholder} /></label>
    </div>
    <div className="catalogue-results"><p className="results-count" aria-live="polite">{products.length} {products.length === 1 ? 'material' : 'materials'}{industry !== 'All industries' && ` in ${industry}`}{query && ` matching “${query}”`}</p>{(query || category !== 'All materials' || industry !== 'All industries') && <button type="button" className="text-link" onClick={clearFilters}>Clear filters</button>}</div>
    <div className="sourcing-grid">{products.map(product => <ProductCard key={product.id} product={product} labels={c} onView={onView} onQuote={onQuote} />)}</div>
    {!products.length && <div className="empty-state"><h3>{c.emptyTitle}</h3><p>{c.emptyText}</p><button type="button" className="button button-dark" onClick={() => onQuote({})}>{c.quoteLabel}</button></div>}
    <div className="catalogue-foot"><p>Looking for something specific?</p><button type="button" className="text-link" onClick={() => onQuote({})}>Talk to our team<span aria-hidden="true">↗</span></button></div>
  </div></section>;
}
