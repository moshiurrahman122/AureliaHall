/* Palais Héritage — the collection.
   One list used by the Great Hall, the Collection grid and the cart.
   `handle` must match the product's handle in Shopify; `sizes` must match its Size option values. */
export const CATEGORIES = [
  { id: 'all', label: 'All Pieces' },
  { id: 'couture', label: 'Couture' },
  { id: 'leather', label: 'Leather Goods' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'watches', label: 'Watches' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'fragrance', label: 'Fragrance' },
];

export const PRODUCT_LIST = [
  { id: 'product_01', handle: 'velvet-embroidered-gown', name: 'Velvet Embroidered Gown', price: '$2,850', sizes: 'XS, S, M, L, XL', category: 'couture' },
  { id: 'product_02', handle: 'burgundy-leather-top-handle-bag', name: 'Burgundy Leather Top-Handle Bag', price: '$2,450', sizes: 'One size', category: 'leather' },
  { id: 'product_03', handle: 'ruby-cascade-necklace', name: 'Ruby Cascade Necklace', price: '$12,800', sizes: 'One size', category: 'jewellery' },
  { id: 'product_04', handle: 'gold-satin-crystal-pumps', name: 'Gold Satin Crystal Pumps', price: '$1,250', sizes: 'EU 36, 37, 38, 39, 40, 41', category: 'shoes' },
  { id: 'product_05', handle: 'gold-dress-watch', name: 'Gold Dress Watch', price: '$9,400', sizes: 'One size', category: 'watches' },
  { id: 'product_06', handle: 'navy-velvet-embroidered-blazer', name: 'Navy Velvet Embroidered Blazer', price: '$1,980', sizes: 'S, M, L, XL', category: 'couture' },
  { id: 'product_07', handle: 'navy-velvet-crest-loafers', name: 'Navy Velvet Crest Loafers', price: '$890', sizes: 'EU 40, 41, 42, 43, 44, 45', category: 'shoes' },
  { id: 'product_08', handle: 'ruby-chandelier-earrings', name: 'Ruby Chandelier Earrings', price: '$6,200', sizes: 'One size', category: 'jewellery' },
  { id: 'product_09', handle: 'crystal-flacon-parfum', name: 'Crystal Flacon Parfum', price: '$380', sizes: '50 ml, 100 ml', category: 'fragrance' },
  { id: 'product_10', handle: 'baroque-silk-twill-scarf', name: 'Baroque Silk Twill Scarf', price: '$420', sizes: '90 × 90 cm', category: 'couture' },
].map((p, i) => ({
  ...p,
  num: String(i + 1).padStart(2, '0'),
  image: `assets/products/${p.id}.jpg`,
}));

/* Keyed by id, in the shape the Great Hall already uses. */
export const PRODUCTS = Object.fromEntries(PRODUCT_LIST.map((p) => [p.id, p]));
export const sizesOf = (p) => String(p.sizes || '').split(',').map((s) => s.trim()).filter(Boolean).map((s, i, all) => {
  // "EU 36, 37, 38" → every value carries the prefix of the first one
  const pre = all[0].match(/^([A-Za-z]+)\s/); return i > 0 && pre && /^\d/.test(s) ? `${pre[1]} ${s}` : s;
});
export const priceNum = (p) => Number(String(p).replace(/[^0-9.]/g, '')) || 0;
export const money = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
