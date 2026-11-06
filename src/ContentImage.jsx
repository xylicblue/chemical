import React, { useEffect, useRef, useState } from 'react';

export default function ContentImage({ src, alt, className = '', onError, onLoad, ...props }) {
  const image = useRef(null);
  const [result, setResult] = useState(null);
  const status = result?.src === src ? result.status : 'loading';
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth > 0) setResult({ src, status: 'ready' });
  }, [src]);
  return <>
    <img {...props} ref={image} src={src} alt={alt} className={`${className} content-image${status === 'ready' ? ' is-ready' : ''}`} aria-hidden={status === 'error' || undefined}
      onLoad={event => { setResult({ src, status: 'ready' }); onLoad?.(event); }}
      onError={event => { setResult({ src, status: 'error' }); onError?.(event); }} />
    {status === 'loading' && <span className="skeleton-block image-loading-mask" aria-hidden="true" />}
    {status === 'error' && !onError && <span className="image-unavailable" role="img" aria-label="Image unavailable">Image unavailable</span>}
  </>;
}
