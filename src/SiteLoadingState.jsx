import React from 'react';

function Bar({ className = '' }) { return <span className={`skeleton-block ${className}`} />; }

export default function SiteLoadingState() {
  return <div className="public-site site-loading" aria-busy="true">
    <p className="sr-only" role="status">Loading website content...</p>
    <div aria-hidden="true">
      <div className="site-header"><div className="shell header-inner">
        <div className="skeleton-brand"><Bar className="skeleton-brand-mark" /><div><Bar className="skeleton-brand-name" /><Bar className="skeleton-brand-detail" /></div></div>
        <div className="skeleton-navigation"><Bar /><Bar /><Bar /><Bar /></div><Bar className="skeleton-mobile-menu" />
      </div></div>
      <main id="main">
        <section className="hero shell">
          <div className="hero-copy"><Bar className="skeleton-eyebrow" /><div className="skeleton-headline"><Bar /><Bar /><Bar /></div>
            <div className="skeleton-description"><Bar /><Bar /><Bar /></div>
            <div className="skeleton-actions"><Bar /><Bar /></div><Bar className="skeleton-tagline" />
          </div>
          <div className="hero-figure"><div className="hero-image-wrap skeleton-block skeleton-hero-image" /><div className="skeleton-caption"><Bar /><Bar /></div></div>
        </section>
        <div className="hero-stats"><div className="shell hero-stats-panel"><div className="hero-stats-grid" style={{ '--stats-count': 4, '--stats-mobile-count': 2 }}>
          {[0, 1, 2, 3].map(index => <div className="hero-stat" key={index}><Bar className="skeleton-stat-value" /><Bar className="skeleton-stat-label" /></div>)}
        </div></div></div>
        <div className="company-section"><div className="shell company-layout"><div className="skeleton-company-heading"><Bar /><Bar /></div><div className="company-cards">
          {[0, 1, 2].map(index => <div className="skeleton-company-card" key={index}><Bar /><Bar /><Bar /></div>)}
        </div></div></div>
      </main>
    </div>
  </div>;
}

export function SiteLoadError({ onRetry }) {
  return <div className="public-site site-status-page"><main id="main" className="shell site-load-error" role="alert">
    <h1>Unable to load the website.</h1><p>Please check your connection and try again.</p>
    <button type="button" className="button button-light" onClick={onRetry}>Try again</button>
  </main></div>;
}
