export const PRODUCTS_PER_PAGE = 12;
export const PRODUCT_LIST_COPY = Object.freeze({
  listingTitle: 'Our products',
  listingDescription: 'Select a product to view its details and request a quotation.',
  listingEmptyTitle: 'Our product collection',
  listingEmptyText: 'Please contact our team for product information and sourcing enquiries.'
});

export function productPage(products, requestedPage = 1, query = '') {
  const term = query.trim().toLocaleLowerCase();
  const visible = products.filter(product => product.visible !== false && (!term || product.name.toLocaleLowerCase().includes(term)));
  const total = visible.length;
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const offset = (page - 1) * PRODUCTS_PER_PAGE;
  return { items: visible.slice(offset, offset + PRODUCTS_PER_PAGE), page, pageCount, total, start: total ? offset + 1 : 0, end: Math.min(offset + PRODUCTS_PER_PAGE, total) };
}

export function productPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const numbers = [...new Set([1, total, ...Array.from({ length: 5 }, (_, i) => Math.min(total - 1, Math.max(2, current - 2)) + i).filter(value => value < total)])].sort((a, b) => a - b);
  const result = [];
  numbers.forEach((number, index) => { if (index && number - numbers[index - 1] > 1) result.push(null); result.push(number); });
  return result;
}
