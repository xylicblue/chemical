import React from 'react';

function Lines({ text }) {
  return text.split('\n').map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>);
}

export default function HeroHeadline({ title, highlight = '' }) {
  const position = highlight ? title.indexOf(highlight) : -1;
  return <h1>{position < 0 ? <Lines text={title} /> : <>
    <Lines text={title.slice(0, position)} />
    <span className="hero-highlight"><Lines text={highlight} /></span>
    <Lines text={title.slice(position + highlight.length)} />
  </>}</h1>;
}
