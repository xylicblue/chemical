import React from 'react';

const kinds = ['stock', 'sourcing', 'range', 'supply', 'documentation', 'support'];
const matches = [
  ['documentation', /document|technical|specification|clear/i],
  ['support', /support|customer|understand|service/i],
  ['sourcing', /international|global|sourcing/i],
  ['range', /range|diverse|selection|material/i],
  ['supply', /flexible|option|delivery/i],
  ['stock', /stock|inventory|ready/i]
];

export default function CompanyIcon({ title, index }) {
  const kind = matches.find(([, pattern]) => pattern.test(title))?.[0] || kinds[index % kinds.length];
  return <svg className="company-card-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === 'stock' && <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9M7.5 5.25l9 4.5"/></>}
    {kind === 'sourcing' && <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M4.5 7.5h15M4.5 16.5h15"/></>}
    {kind === 'range' && <><path d="m12 3 9.5 5L12 13 2.5 8 12 3Z"/><path d="m2.5 12 9.5 5 9.5-5M2.5 16l9.5 5 9.5-5"/></>}
    {kind === 'supply' && <><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></>}
    {kind === 'documentation' && <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z"/><path d="M14 3v5h5M8.5 12h7M8.5 15.5h7M8.5 19h4"/></>}
    {kind === 'support' && <><path d="M4 13v-2a8 8 0 0 1 16 0v6a4 4 0 0 1-4 4h-3"/><rect x="3" y="11" width="4" height="7" rx="1.5"/><rect x="17" y="11" width="4" height="7" rx="1.5"/><path d="M11 21h2"/></>}
  </svg>;
}
