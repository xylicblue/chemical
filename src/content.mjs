import { CATALOGUE_LABELS, createDefaultBrandLogo, createDefaultHeroStats, createDefaultPartnerTicker, withProductDefaults } from './model.mjs';

export const initialContent = {
  brandLogo: createDefaultBrandLogo(),
  heroStats: createDefaultHeroStats(),
  partnerTicker: createDefaultPartnerTicker(),
  brand: { name: 'Aster', descriptor: 'CHEMICALS', tagline: 'Considered chemistry. Lasting partnerships.' },
  hero: {
    eyebrow: 'Your Trusted Chemical Partner',
    title: 'Powering Industries Through Reliable Chemical Supply.',
    highlight: 'Reliable Chemical Supply.',
    description: 'Your trusted sourcing and distribution partner for quality chemical raw materials, serving pharmaceutical, cosmetic, food, textile and industrial businesses across Pakistan.',
    primary: 'Explore Products', secondary: 'Request a Quote',
    image: '/assets/chemistry-still-life.webp',
    imageAlt: 'Clear laboratory glassware with blue and sage liquids and a dish of mineral crystals',
    caption: 'PRECISION IN EVERY DETAIL', captionDetail: 'From first specification to final delivery.'
  },
  intro: {
    eyebrow: 'A CLEARER CONNECTION',
    title: 'Good chemistry starts\nwith understanding.',
    description: 'Every application has its own requirements. We bring clarity to chemical sourcing, helping you find materials that fit your process, your standards, and your next step.',
    note: 'A considered approach to chemical supply.',
    pillars: [
      { title: 'Know the material.', text: 'Start with the specification. Discuss grades, applications, and documentation before choosing a product.' },
      { title: 'Understand the need.', text: 'Tell us what you are making and what matters to your process. We will help define the next step.' },
      { title: 'Keep it clear.', text: 'Straightforward conversations about sourcing, packaging, and delivery requirements.' }
    ]
  },
  catalogue: { ...CATALOGUE_LABELS, eyebrow: 'THE PRODUCT COLLECTION', title: 'Materials with purpose.', description: 'Explore a sample of our product range. Find your category, review the details, and start a conversation.', searchPlaceholder: 'Search name, application or CAS number', emptyTitle: 'No matching materials.', emptyText: 'Try another search or category. You can also ask us about a specific material.' },
  products: [
    { id: 'sodium-carbonate', name: 'Sodium carbonate', category: 'Industrial', formula: 'Na₂CO₃', cas: '497-19-8', grade: 'Grade to be confirmed', description: 'A versatile inorganic material commonly discussed for glass, detergent, and industrial processing applications.', applications: 'Glass manufacturing, detergents, process chemistry', packaging: 'Packaging and order quantities on request', note: 'Confirm grade, suitability, specifications, and handling requirements with the supplier before ordering.', featured: true, visible: true },
    { id: 'citric-acid', name: 'Citric acid', category: 'Specialty', formula: 'C₆H₈O₇', cas: '77-92-9', grade: 'Grade to be confirmed', description: 'An organic acid used in a range of formulations and processing applications where acidity control is required.', applications: 'Formulation, cleaning, process adjustment', packaging: 'Packaging and order quantities on request', note: 'Application suitability and regulatory requirements depend on the supplied grade. Request full documentation.', featured: true, visible: true },
    { id: 'isopropyl-alcohol', name: 'Isopropyl alcohol', category: 'Solvents', formula: 'C₃H₈O', cas: '67-63-0', grade: 'Grade to be confirmed', description: 'A commonly used solvent for industrial cleaning and technical formulation applications.', applications: 'Industrial cleaning, coatings, technical formulations', packaging: 'Packaging and order quantities on request', note: 'Flammable material. Obtain and review the current safety data sheet before transport, storage, or use.', featured: true, visible: true },
    { id: 'hydrogen-peroxide', name: 'Hydrogen peroxide', category: 'Water & process', formula: 'H₂O₂', cas: '7722-84-1', grade: 'Concentration to be confirmed', description: 'An oxidising material used in selected water and industrial process applications, subject to concentration and suitability.', applications: 'Water processes, textiles, industrial treatment', packaging: 'Compatible packaging on request', note: 'Oxidising material. Concentration, compatibility, storage, and handling must be assessed against the current safety data sheet.', featured: true, visible: true },
    { id: 'calcium-carbonate', name: 'Calcium carbonate', category: 'Industrial', formula: 'CaCO₃', cas: '471-34-1', grade: 'Particle size to be confirmed', description: 'A mineral material used as a filler and functional ingredient across a range of industrial formulations.', applications: 'Polymers, coatings, construction materials', packaging: 'Packaging and order quantities on request', note: 'Request grade, particle-size distribution, and product documentation to assess suitability.', featured: false, visible: true },
    { id: 'glycerine', name: 'Glycerine', category: 'Specialty', formula: 'C₃H₈O₃', cas: '56-81-5', grade: 'Grade to be confirmed', description: 'A polyol considered for technical formulations where moisture retention and processing properties are relevant.', applications: 'Technical formulations, process applications', packaging: 'Packaging and order quantities on request', note: 'Confirm origin, grade, specifications, and application requirements before ordering.', featured: false, visible: true }
  ].map(withProductDefaults),
  industrySection: { eyebrow: 'BUILT AROUND YOUR APPLICATION', title: 'Different industries.\nThe same attention to detail.', description: 'A material is only the beginning. Understanding where it goes makes the difference.' },
  industries: [
    { name: 'Manufacturing', detail: 'Raw materials for the processes behind everyday products.', number: '01' },
    { name: 'Water & environment', detail: 'Materials for carefully specified treatment applications.', number: '02' },
    { name: 'Coatings & construction', detail: 'Ingredients for formulations, finishes, and building materials.', number: '03' },
    { name: 'Textiles & processing', detail: 'Chemical sourcing shaped around production requirements.', number: '04' }
  ],
  approach: { eyebrow: 'FROM QUESTION TO CLARITY', title: 'A simpler path\nto the right material.', steps: [
    { title: 'Tell us what you need.', text: 'Share your application, specification, quantity, and destination. A clear brief gives us the right starting point.' },
    { title: 'Explore the details.', text: 'Discuss available grades, documentation, packaging, and proposed supply arrangements with our team.' },
    { title: 'Agree the next step.', text: 'Review the quotation and confirm product suitability, commercial terms, and delivery requirements.' }
  ] },
  contact: { eyebrow: 'LET’S MAKE SOMETHING POSSIBLE', title: 'Your next step\nstarts with a conversation.', description: 'Looking for a particular material, or simply exploring your options? Tell us what you have in mind.', email: 'hello@example.com', phone: '', address: 'Your office address, city and country', hours: 'Add your business hours', button: 'Start an inquiry' },
  footer: { line: 'Chemistry, thoughtfully connected.', disclaimer: 'Demonstration website. Company information and product entries are sample content for replacement before public launch.', copyright: 'Aster Chemicals', privacyTitle: 'Your information.', privacyText: 'When you submit an inquiry, the details you provide are stored in our inquiry system so the team can respond. Public browsing does not require an account. The editor stores local drafts in your browser.\n\nFor access or deletion requests, use the published contact details. This is a template notice. Replace it with your legal identity, retention periods, and privacy terms before public launch.', productInfoTitle: 'About this collection.', productInfoText: 'This catalogue contains illustrative information. It is not a guarantee of stock, grade, purity, certification, price, suitability, or delivery.\n\nObtain current specifications, safety data sheets, certificates where applicable, and commercial terms directly from the supplier before ordering or using any material.' },
  navigation: { products: 'Products', industries: 'Industries', approach: 'Our approach', contact: 'Get in touch' }
};
