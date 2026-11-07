import { visibleProducts } from './model.mjs';

export function popularMaterialRows(content) {
  const visible = visibleProducts(content);
  const featured = visible.filter(product => product.featured);
  const items = featured.length ? featured : visible;
  if (!items.length) return [];
  if (items.length <= 8) return [items];
  const halfway = Math.ceil(items.length / 2);
  return [items.slice(0, halfway), items.slice(halfway)];
}
