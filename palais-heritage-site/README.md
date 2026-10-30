# Palais Héritage — website

A scroll journey from the blue-hour facade of the town hall, through the bronze doors, into the 3D Great Hall. Visitors click a piece to see its name, price and sizes, then add it to the cart.

## Folder

```
palais-heritage-site/
├── index.html        page structure (header, hero, product card, cart, menu)
├── css/style.css     all styling (brand colours, glass & gold UI)
├── js/main.js        scroll journey, 3D hall, product clicks, cart
└── assets/
    ├── hall.glb      the Great Hall + products, exported from Blender
    ├── hero.jpg      blue-hour render of the facade (1920×1080)
    └── logo.svg      Palais Héritage monogram (gold, #C4A468)
```

## Run it

The 3D hall loads from `assets/hall.glb`, and browsers block that when you double-click `index.html`. Serve the folder instead:

- **Antigravity / VS Code:** open the folder and start a live preview (e.g. the Live Server extension), or
- **Terminal:** `cd palais-heritage-site` then `python3 -m http.server 8000`, and open http://localhost:8000

An internet connection is needed for the fonts and three.js (loaded from Google Fonts and jsDelivr).

## Getting around the hall

- **Scroll** walks the guided tour from stop to stop.
- **Drag** looks around in any direction at any time, on the tour or while exploring. It eases and carries a little momentum. A two-finger sideways swipe on a trackpad also turns the view.
- **Walk freely** with W A S D or the arrow keys, the on-screen arrows, or by clicking the floor. Scrolling picks the tour back up from the nearest stop.
- **Go to any piece:** the Collection wheel on the right is split into one slice per product, each showing that piece. Hover a slice to see its name and price in the centre; click it to fly there and open its card. The menu's Collection list does the same.
- **Guided Tour | Explore Freely:** the two-option switch at the bottom left changes how you move.

## Edit the products

Names, prices and sizes live in two places; the values stored in the model win:

1. In Blender, on each `product_01` … `product_10` empty (Object Properties → Custom Properties: `name`, `price`, `sizes`). Re-export `hall.glb` after changes.
2. In `js/main.js`, the `PRODUCTS` list at the top (used before the model finishes loading).

Sizes are a comma-separated list, e.g. `XS, S, M, L, XL` or `One size`.

## Camera stops

`STATIONS` in `js/main.js` lists each stop on the walk: its title, the product it shows, the camera position and where it looks. Add, remove or reorder entries to change the tour; the scroll length adjusts itself.

## Next steps

- Checkout: connect `#checkoutBtn` to Shopify (Storefront API) or WooCommerce.
- Products 02–10 will be rebuilt in Blender to the same standard as the gown, then re-exported into `hall.glb`.
