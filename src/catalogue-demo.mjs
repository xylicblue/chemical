import { withProductDefaults } from './model.mjs';

const sampleNames = ['Acetic acid', 'Sodium hydroxide', 'Potassium hydroxide', 'Sodium bicarbonate', 'Sodium sulphate', 'Sodium chloride', 'Calcium chloride', 'Magnesium sulphate', 'Zinc oxide', 'Titanium dioxide', 'Sorbitol', 'Propylene glycol', 'Polyethylene glycol', 'Ethanol', 'Acetone', 'Ethyl acetate', 'Butyl acetate', 'Sodium benzoate', 'Potassium sorbate', 'Sodium metabisulphite', 'Sodium citrate', 'Oxalic acid', 'Phosphoric acid', 'Lactic acid', 'Boric acid', 'Stearic acid', 'Sodium silicate', 'Ammonium chloride', 'Urea', 'Dextrose', 'Sodium gluconate', 'Sodium tripolyphosphate'];

export function catalogueWithSamples(products) {
  const existing = new Set(products.map(product => product.name.trim().toLocaleLowerCase()));
  const samples = sampleNames.filter(name => !existing.has(name.toLocaleLowerCase())).slice(0, 24).map(name => withProductDefaults({
    id: `preview-${name.toLocaleLowerCase().replaceAll(' ', '-')}`,
    name, category: 'Preview product', description: 'Sample entry for reviewing the product directory and pagination.',
    note: 'This is a preview entry. It does not confirm stock, grade, packaging, or availability.',
    visible: true, featured: false, demo: true, fieldVisibility: { category: false, tds: false, sds: false }
  }));
  return [...products, ...samples];
}
