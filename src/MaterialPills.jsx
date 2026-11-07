import React, { useEffect, useRef, useState } from 'react';

export default function MaterialPills({ products, onView }) {
  const viewport = useRef(null);
  const baseSet = useRef(null);
  const [layout, setLayout] = useState({ repeat: 1, width: 0 });
  const [reduced, setReduced] = useState(false);
  const key = products.map(p => `${p.id}:${p.name}`).join('|');
  const moving = products.length > 1 && !reduced;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const measure = () => {
      const width = baseSet.current?.getBoundingClientRect().width || 0;
      if (!width || !viewport.current) return;
      const repeat = Math.max(1, Math.ceil(viewport.current.clientWidth / width));
      setLayout(old => old.repeat === repeat && Math.abs(old.width - width) < .5 ? old : { repeat, width });
    };
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (baseSet.current) observer.observe(baseSet.current);
    measure();
    return () => observer.disconnect();
  }, [key]);

  function set(duplicate, index) {
    return <div className="material-pill-set" key={index} ref={!duplicate ? baseSet : undefined} aria-hidden={duplicate || undefined}>
      {products.map(p => <button type="button" className="material-pill" key={p.id} tabIndex={duplicate ? -1 : undefined} onMouseDown={duplicate ? e => e.preventDefault() : undefined} onClick={() => onView(p)}>{p.name}</button>)}
    </div>;
  }
  return <div ref={viewport} className={`materials-viewport${moving && layout.width ? ' materials-moving' : ''}`}>
    <div className="materials-track" style={{ '--materials-duration': `${Math.max(35, layout.width * layout.repeat / 22)}s`, animationDirection: 'reverse' }}>
      <div className="materials-group">{set(false, 0)}{moving && Array.from({ length: layout.repeat - 1 }, (_, i) => set(true, i + 1))}</div>
      {moving && <div className="materials-group materials-duplicate" aria-hidden="true">{Array.from({ length: layout.repeat }, (_, i) => set(true, i))}</div>}
    </div>
  </div>;
}
