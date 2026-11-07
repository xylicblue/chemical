import React, { useEffect, useId, useRef, useState } from 'react';
import { isSafeImage } from './model.mjs';
import ContentImage from './ContentImage.jsx';

const pixelsPerSecond = { slow: 24, standard: 36, fast: 48 };

export function PartnerCard({ partner }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [partner.logo]);
  const showLogo = partner.presentation === 'logo' && isSafeImage(partner.logo) && !failed;
  return (
    <div className="partner-card">
      {showLogo ? (
        <ContentImage src={partner.logo} alt="" decoding="async" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="partner-card-name">{partner.name}</span>
      )}
    </div>
  );
}

export default function PartnerTicker({ settings }) {
  const viewport = useRef(null);
  const group = useRef(null);
  const headingId = useId();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [repeat, setRepeat] = useState(1);
  const [distance, setDistance] = useState(0);
  const items = (settings?.items || []).filter(item => item.visible);
  const itemsKey = items.map(item => item.id).join('|');
  const canMove = Boolean(settings?.moving && items.length > 1 && !reducedMotion);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!viewport.current || !group.current || !items.length) return;
    const measure = () => {
      const first = group.current?.firstElementChild;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(group.current).columnGap) || 0;
      const baseWidth = (first.getBoundingClientRect().width + gap) * items.length;
      const nextRepeat = canMove ? Math.max(1, Math.ceil(viewport.current.clientWidth / baseWidth)) : 1;
      setRepeat(previous => previous === nextRepeat ? previous : nextRepeat);
      const nextDistance = baseWidth * nextRepeat;
      setDistance(previous => Math.abs(previous - nextDistance) < 0.5 ? previous : nextDistance);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport.current);
    observer.observe(group.current);
    measure();
    return () => observer.disconnect();
  }, [itemsKey, canMove, settings?.enabled]);

  if (!settings?.enabled || !items.length) return null;
  const repeated = Array.from({ length: canMove ? repeat : 1 }, () => items).flat();
  const duration = Math.max(1, distance / (pixelsPerSecond[settings.speed] || 24));
  const hasHeading = Boolean(settings.heading.trim());

  return (
    <section className="partners-section" aria-labelledby={hasHeading ? headingId : undefined} aria-label={hasHeading ? undefined : 'Supply partners'}>
      <div className="shell partners-heading">
        <div>
          {hasHeading && <h2 id={headingId}>{settings.heading}</h2>}
          {settings.note && <p>{settings.note}</p>}
        </div>
      </div>
      <ul className="sr-only">
        {items.map(item => <li key={item.id}>{item.name}{item.presentation === 'logo' && item.logoAlt ? `. ${item.logoAlt}` : ''}</li>)}
      </ul>
      <div
        ref={viewport}
        className={`partners-viewport ${canMove ? 'partners-animated' : 'partners-static'}`}
        role={canMove ? undefined : 'group'}
        aria-label={canMove ? undefined : 'Scrollable partner cards'}
        tabIndex={canMove ? undefined : 0}
      >
        <div
          className="partners-track"
          aria-hidden="true"
          style={{
            '--ticker-distance': `${distance}px`,
            '--ticker-duration': `${duration}s`,
            animationDirection: settings.direction === 'right' ? 'reverse' : 'normal'
          }}
        >
          <div className="partners-group" ref={group}>
            {repeated.map((item, index) => <PartnerCard partner={item} key={`${item.id}-${index}`} />)}
          </div>
          {canMove && <div className="partners-group">{repeated.map((item, index) => <PartnerCard partner={item} key={`${item.id}-${index}`} />)}</div>}
        </div>
      </div>
    </section>
  );
}
