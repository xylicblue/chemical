import React, { useEffect, useState } from 'react';
import { withContentDefaults } from './model.mjs';
import { createSiteContentRequest } from './content-loader.mjs';
import SiteLoadingState, { SiteLoadError } from './SiteLoadingState.jsx';

export default function SiteContentBoundary({ previewContent, children }) {
  const [content, setContent] = useState(() => previewContent ? withContentDefaults(previewContent) : null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
  useEffect(() => {
    if (previewContent) { setContent(withContentDefaults(previewContent)); setError(false); return; }
    setContent(null);
    setError(false);
    if (preview) {
      const timer = setTimeout(() => setError(true), 15000);
      const receive = event => {
        if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'aster-preview' || !event.data.content) return;
        try {
          setContent(withContentDefaults(event.data.content));
          setError(false);
          clearTimeout(timer);
        } catch { setError(true); }
      };
      window.addEventListener('message', receive);
      window.parent.postMessage({ type: 'aster-preview-ready' }, window.location.origin);
      return () => { clearTimeout(timer); window.removeEventListener('message', receive); };
    }
    return createSiteContentRequest({ onReady: setContent, onError: () => setError(true) });
  }, [previewContent, preview, attempt]);
  if (error) return <SiteLoadError onRetry={() => { setContent(null); setError(false); setAttempt(value => value + 1); }} />;
  if (!content) return <SiteLoadingState />;
  return children(content);
}
