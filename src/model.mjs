export const clone = value => structuredClone(value);
export function createDefaultBrandLogo(name = 'A') {
  return { mode: 'initials', text: String(name).trim().slice(0, 1).toUpperCase() || 'A', image: '' };
}
export function createDefaultHeroStats() {
  return {
    enabled: true,
    heading: 'Our company in numbers',
    items: [
      { value: '00+', label: 'Years of experience' },
      { value: '00+', label: 'Products available' },
      { value: '00+', label: 'Supply partners' },
      { value: '00+', label: 'Industries served' }
    ]
  };
}
export function createDefaultPartnerTicker() {
  return {
    enabled: true,
    moving: true,
    heading: 'Supply partners',
    note: 'Sample names. Replace with your confirmed supply partners.',
    speed: 'slow',
    direction: 'left',
    items: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((name, index) => ({
      id: `partner-${index + 1}`,
      name: `Partner ${name}`,
      presentation: 'text',
      logo: '',
      logoAlt: '',
      visible: true
    }))
  };
}
export function withContentDefaults(content) {
  return {
    ...content,
    brandLogo: content.brandLogo === undefined ? createDefaultBrandLogo(content.brand?.name) : content.brandLogo,
    heroStats: content.heroStats === undefined ? createDefaultHeroStats() : content.heroStats,
    partnerTicker: content.partnerTicker === undefined ? createDefaultPartnerTicker() : content.partnerTicker
  };
}
export function visibleProducts(content, query = '', category = 'All materials') {
  const term = query.trim().toLocaleLowerCase();
  return content.products.filter(p => p.visible !== false && (category === 'All materials' || p.category === category) && (!term || [p.name, p.category, p.cas, p.formula, p.description, p.applications].join(' ').toLocaleLowerCase().includes(term))).sort((a,b)=>Number(b.featured)-Number(a.featured));
}
export function categories(content) { return ['All materials', ...new Set(content.products.filter(p => p.visible !== false).map(p => p.category))]; }
export function validateContent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Website content must be an object.');
  for (const k of ['brand','hero','intro','catalogue','industrySection','approach','contact','footer','navigation']) {
    if (!data[k] || typeof data[k] !== 'object' || Array.isArray(data[k])) throw new Error(`Missing website section: ${k}.`);
  }
  const text = (v, field, max = 5000, required = false) => { if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw new Error(`Please check ${field}.`); };
  text(data.brand.name, 'company name', 100, true); text(data.hero.title, 'headline', 240, true);
  if (data.brandLogo !== undefined) {
    const logo = data.brandLogo;
    if (!logo || typeof logo !== 'object' || Array.isArray(logo) || !['initials', 'image', 'hidden'].includes(logo.mode)) throw new Error('Please check the company logo display setting.');
    text(logo.text, 'logo initials', 3, logo.mode === 'initials');
    text(logo.image, 'company logo URL', 2048, logo.mode === 'image');
    if (logo.image && !isSafeImage(logo.image)) throw new Error('Use an HTTPS company logo URL or a local asset path.');
  }
  if (data.heroStats !== undefined) {
    const stats = data.heroStats;
    if (!stats || typeof stats !== 'object' || Array.isArray(stats) || typeof stats.enabled !== 'boolean') throw new Error('Please check the hero statistics settings.');
    text(stats.heading, 'statistics section name', 120, true);
    if (!Array.isArray(stats.items) || stats.items.length > 4) throw new Error('Add up to four hero statistics.');
    for (const item of stats.items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Please check the hero statistic.');
      text(item.value, 'statistic value', 20, true);
      text(item.label, 'statistic label', 100, true);
    }
  }
  if (!Array.isArray(data.products) || data.products.length > 500) throw new Error('The catalogue can contain up to 500 products.');
  const ids = new Set();
  for (const p of data.products) {
    text(p.id, 'product identifier', 100, true); text(p.name, 'product name', 160, true); text(p.category, 'product category', 100, true);
    if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw new Error('Product identifiers must be unique and use lowercase letters, numbers, or hyphens.');
    ids.add(p.id);
    for (const key of ['formula','cas','grade','description','applications','packaging','note']) text(p[key], `product ${key}`);
    if (typeof p.visible !== 'boolean' || typeof p.featured !== 'boolean') throw new Error('Product visibility values are invalid.');
  }
  if (!Array.isArray(data.industries) || data.industries.length > 30) throw new Error('Add up to 30 industries.');
  for (const i of data.industries) { text(i.name, 'industry name', 120, true); text(i.detail, 'industry description'); text(i.number, 'industry number', 10); }
  for (const key of ['pillars']) { if (!Array.isArray(data.intro[key]) || data.intro[key].length > 12) throw new Error('Check the company principles.'); for (const v of data.intro[key]) { text(v.title, 'principle title', 180, true); text(v.text, 'principle description'); } }
  if (!Array.isArray(data.approach.steps) || data.approach.steps.length > 12) throw new Error('Check the approach steps.');
  for (const v of data.approach.steps) { text(v.title, 'step title', 180, true); text(v.text, 'step description'); }
  if (data.partnerTicker !== undefined) {
    const ticker = data.partnerTicker;
    if (!ticker || typeof ticker !== 'object' || Array.isArray(ticker)) throw new Error('Please check the supply partner settings.');
    if (typeof ticker.enabled !== 'boolean' || typeof ticker.moving !== 'boolean') throw new Error('Please check the partner ticker visibility and movement settings.');
    text(ticker.heading, 'partner section heading', 120);
    text(ticker.note, 'partner section note', 500);
    if (!['slow', 'standard', 'fast'].includes(ticker.speed) || !['left', 'right'].includes(ticker.direction)) throw new Error('Please check the partner ticker speed and direction.');
    if (!Array.isArray(ticker.items) || ticker.items.length > 40) throw new Error('Add up to 40 supply partners.');
    const partnerIds = new Set();
    for (const partner of ticker.items) {
      if (!partner || typeof partner !== 'object' || Array.isArray(partner)) throw new Error('Please check the supply partner entry.');
      text(partner.id, 'partner identifier', 100, true);
      if (!/^[a-z0-9-]+$/.test(partner.id) || partnerIds.has(partner.id)) throw new Error('Supply partner identifiers must be unique lowercase letters, numbers, or hyphens.');
      partnerIds.add(partner.id);
      text(partner.name, 'partner name', 160, true);
      text(partner.logo, 'partner logo URL', 2048);
      text(partner.logoAlt, 'partner logo description', 240);
      if (partner.logo && !isSafeImage(partner.logo)) throw new Error('Use an HTTPS partner logo URL or a local asset path.');
      if (!['text', 'logo'].includes(partner.presentation) || typeof partner.visible !== 'boolean') throw new Error('Please check the partner display settings.');
    }
  }
  const checkStrings = obj => { for (const [key,v] of Object.entries(obj)) { if (typeof v === 'string') { text(v, key); if (v.includes('\u2014')) throw new Error('Use a full stop or comma instead of an em dash.'); } else if (v && typeof v === 'object') checkStrings(v); } }; checkStrings(data);
  if (data.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) throw new Error('Enter a valid contact email address.');
  if (!isSafeImage(data.hero.image)) throw new Error('Use an HTTPS image URL or a local asset path.');
  if (JSON.stringify(data).length > 750000) throw new Error('Content is too large.');
  return data;
}
export function isSafeImage(url) { return typeof url === 'string' && (/^https:\/\/[^\s]+$/i.test(url) || /^\/assets\/[a-z0-9._/-]+$/i.test(url)) && !/[<>"']/.test(url); }
export function validateInquiry(body) {
  const field = (k, max, required = true) => { if (typeof body[k] !== 'string' || body[k].length > max || (required && !body[k].trim())) throw new Error(`Please check your ${k}.`); return body[k].trim(); };
  const name = field('name',120), email = field('email',254), company = field('company',180,false), product = field('product',180,false), quantity = field('quantity',180,false), message = field('message',5000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (body.consent !== true) throw new Error('Please agree to being contacted about your inquiry.');
  return { name, email, company, product, quantity, message };
}
