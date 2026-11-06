import React from 'react';

export default function HeroStats({ settings }) {
  if (!settings?.enabled || !settings.items.length) return null;
  return (
    <section className="hero-stats" aria-label={settings.heading}>
      <div className="shell hero-stats-panel">
        <dl className="hero-stats-grid" style={{ '--stats-count': settings.items.length, '--stats-mobile-count': Math.min(2, settings.items.length) }}>
          {settings.items.map((item, index) => (
            <div className="hero-stat" key={index}>
              <dt>{item.label}</dt>
              <dd>{item.value.endsWith('+') ? <>{item.value.slice(0, -1)}<span>+</span></> : item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
