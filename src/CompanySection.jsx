import React, { useId, useLayoutEffect, useRef, useState } from 'react';

function CompanyCard({ item }) {
  const headingId = useId();
  const description = useRef(null);
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const hasDescription = Boolean(item.text?.trim());

  useLayoutEffect(() => {
    const element = description.current;
    if (!element) { setDescriptionHeight(0); return; }
    const measure = () => setDescriptionHeight(element.getBoundingClientRect().height);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [hasDescription]);

  return <article className={`company-card${hasDescription ? ' company-card-reveal' : ''}`} tabIndex={hasDescription ? 0 : undefined} aria-labelledby={headingId} style={{ '--company-description-height': `${descriptionHeight}px` }}>
    <div className="company-card-copy">
      <h3 id={headingId}>{item.title}</h3>
      {hasDescription && <p ref={description}>{item.text}</p>}
    </div>
  </article>;
}

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
          {content.pillars.map((item, index) => <CompanyCard item={item} key={index}/>)}
        </div>
      </div>
    </section>
  );
}
