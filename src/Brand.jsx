import React, { useState } from 'react';
import { createDefaultBrandLogo, isSafeImage } from './model.mjs';

export function BrandMark({ settings, name }) {
  const [failedSource, setFailedSource] = useState('');
  if (settings.mode === 'hidden') return null;
  const image = settings.mode === 'image' && isSafeImage(settings.image) && failedSource !== settings.image;
  const initials = settings.text.trim() || createDefaultBrandLogo(name).text;
  return (
    <span className={`brand-mark${image ? ' brand-mark-image' : ''}`} aria-hidden="true">
      {image ? <img src={settings.image} alt="" width="44" height="44" decoding="async" onError={() => setFailedSource(settings.image)} /> :
        <span className={`brand-initials${initials.length > 1 ? ' brand-initials-small' : ''}`}>{initials}</span>}
    </span>
  );
}

export default function Brand({ content, dark = false }) {
  const settings = content.brandLogo || createDefaultBrandLogo(content.brand.name);
  return (
    <a href="/" className={`brand ${dark ? 'brand-light' : ''}`} aria-label={`${content.brand.name} ${content.brand.descriptor} home`}>
      <BrandMark settings={settings} name={content.brand.name} />
      <span className="brand-name">{content.brand.name}<small>{content.brand.descriptor}</small></span>
    </a>
  );
}
