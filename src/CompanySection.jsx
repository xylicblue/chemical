import React from 'react';

export default function CompanySection({ content }) {
  return (
    <section className="company-section" id="company" aria-labelledby="company-title">
      <div className="shell company-layout">
        <header className="company-heading">
          <div>
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 id="company-title">{String(content.title || '').split('\n').map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</h2>
          </div>
          <div className="company-summary">
            <p className="company-lead">{content.description}</p>
            {content.note && <p className="company-note">{content.note}</p>}
          </div>
        </header>
        <div className="company-cards">
          {content.pillars.map((item, index) => (
            <article className="company-card" key={index}>
              <span className="company-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
