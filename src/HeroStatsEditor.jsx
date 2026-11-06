import React from 'react';

export default function HeroStatsEditor({ settings, onChange, busy }) {
  const change = (key, value) => onChange({ ...settings, [key]: value });
  const edit = (index, key, value) => change('items', settings.items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  function move(index, offset) {
    const items = [...settings.items];
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    change('items', items);
  }
  return (
    <fieldset className="stats-editor" disabled={busy}>
      <legend className="sr-only">Hero statistics settings</legend>
      <p className="stats-editor-help">Add up to four figures at the base of your homepage introduction. Replace every 00+ placeholder with a verified company figure, or hide this panel until the figures are ready.</p>
      <label className="editor-toggle"><input type="checkbox" checked={settings.enabled} onChange={e => change('enabled', e.target.checked)} /><span>Show hero statistics</span></label>
      <label className="editor-field"><span>Section name for accessibility</span><input value={settings.heading} maxLength={120} onChange={e => change('heading', e.target.value)} /><small>Describes this panel to screen readers.</small></label>
      {settings.items.map((item, index) => (
        <article className="editor-subcard" key={index}>
          <div className="editor-subcard-heading"><strong>Statistic {index + 1}</strong><div>
            <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move statistic ${index + 1} up`}>Up</button>
            <button type="button" disabled={index === settings.items.length - 1} onClick={() => move(index, 1)} aria-label={`Move statistic ${index + 1} down`}>Down</button>
            <button type="button" onClick={() => change('items', settings.items.filter((_, i) => i !== index))} aria-label={`Remove statistic ${index + 1}`}>Remove</button>
          </div></div>
          <label className="editor-field"><span>Number or figure</span><input value={item.value} maxLength={20} onChange={e => edit(index, 'value', e.target.value)} placeholder="e.g. 70+" /><small>Include a plus sign, percentage, or unit if needed.</small></label>
          <label className="editor-field"><span>Statistic label</span><input value={item.label} maxLength={100} onChange={e => edit(index, 'label', e.target.value)} placeholder="e.g. Years of experience" /></label>
        </article>
      ))}
      {!settings.items.length && <p className="editor-empty">No statistics added. The panel stays hidden until you add a figure.</p>}
      <button type="button" className="editor-small-button" disabled={settings.items.length >= 4} onClick={() => change('items', [...settings.items, { value: '00+', label: 'New statistic' }])}>Add statistic</button>
    </fieldset>
  );
}
