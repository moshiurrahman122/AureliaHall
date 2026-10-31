# Palais Héritage — website

One page: a scroll journey from the town square, through the bronze doors, into the 3D Great Hall. Everything else opens over the hall: the product card, the cart, **The Collection** (all ten pieces in a grid) and **Contact** (concierge details and an appointment form), both from the menu. Checkout is ready to switch to Shopify.

## Folder

```
palais-heritage-site/
├── index.html          the site
├── vercel.json         Vercel settings (clean URLs, caching)
├── css/style.css       all styling
├── js/catalog.js       ★ the product list: names, prices, sizes, Shopify handles
├── js/shop-config.js   ★ Shopify domain + token, contact email and form endpoint
├── js/shop.js          cart and Shopify checkout
├── js/main.js          the Great Hall, Collection grid and Contact popup
└── assets/
    ├── hall.glb, exterior.glb   the hall and the square, exported from Blender
    ├── products/product_XX.jpg  studio render of each piece (Collection grid)
    ├── hero.jpg                 render of the square
    └── logo.svg
```

## Run it on your Mac

Browsers block the 3D files when you double-click a page, so serve the folder:

- **VS Code / Antigravity:** open the folder and start Live Server, or
- **Terminal:** `cd ~/AureliaHall/palais-heritage-site` then `python3 -m http.server 8000`, and open http://localhost:8000

## Publish on Vercel

You need a free Vercel account and Node.js on your Mac (you have both if `node -v` prints a version).

1. Open **Terminal** on your Mac.
2. `cd ~/AureliaHall/palais-heritage-site`
3. `npx vercel` — the first time, it asks you to log in (a browser window opens) and a few questions. Accept the defaults: no build command, output directory `./`.
4. That gives you a preview link. When it looks right, run `npx vercel --prod` for the live site.
5. Every later update: run `npx vercel --prod` again from the same folder.

To use your own domain, open the project on vercel.com → **Settings → Domains** and add it.

## Connect Shopify

The site works now with its own cart. Checkout switches to Shopify's secure checkout once these steps are done.

1. **Create the store** at shopify.com (any plan that includes online checkout).
2. **Add the ten products.** For each one, the **handle** (Products → the product → *Search engine listing* → URL handle) must match `handle` in `js/catalog.js`, for example `ruby-cascade-necklace`.
   - Pieces with sizes: add an option called **Size** whose values match the site exactly: `XS, S, M, L, XL` · `EU 36 … EU 41` · `EU 40 … EU 45` · `50 ml, 100 ml` · `90 × 90 cm`.
   - One-size pieces: no options needed.
3. **Make a Storefront API token:** install Shopify's **Headless** sales channel (Shopify App Store → "Headless"), create a storefront, and copy the **public access token**. Then publish your products to that Headless channel.
4. **Fill in `js/shop-config.js`:** `domain: 'your-store.myshopify.com'` and `storefrontToken: '…'`. This token is meant to be public; never put an Admin API token in the site.
5. Run `npx vercel --prod` again. Add something to the cart and press **Proceed to Checkout**: you land on Shopify's checkout with the same pieces and sizes.

If a product or size is missing in Shopify, the cart says which one, so you can fix it.

## Contact form

Without a form service, **Send Request** opens the visitor's email app with the request filled in, addressed to the email in `js/shop-config.js`. To receive requests directly, create a free form at formspree.io, and paste its endpoint into `CONTACT.formEndpoint`.

The appointment hours and concierge email in the Contact popup are placeholders: edit them in `index.html` (the `#contact` section) and `js/shop-config.js`.

## Edit the products

`js/catalog.js` is the product list for the Collection grid and the cart: name, price, sizes and Shopify handle. The Great Hall also reads names, prices and sizes stored on each `product_XX` empty in Blender (custom properties); those win in the hall, so change both, or re-export `hall.glb`.

Sizes are a comma-separated list, e.g. `XS, S, M, L, XL` or `One size`.

## Getting around the hall

- **Scroll** walks the guided tour. **Drag** looks around, with easing and momentum.
- **Explore Freely:** W A S D / arrow keys, or click the floor. Scrolling picks the tour back up.
- **Collection wheel** (bottom right): click a slice to fly to that piece.
- **Logo:** returns smoothly to the landing view.
- **Menu → The Collection:** a grid of every piece over the hall; select one to walk to it.
- **Menu → Contact:** concierge details and the appointment form.
- `index.html#product_XX` opens the site and walks straight to that piece.

## The collection (all modelled in Blender, no photos)

| No. | Piece | In the hall |
|---|---|---|
| 01 | Velvet Embroidered Gown | centre, on the rosso marble compass |
| 02 | Burgundy Leather Top-Handle Bag | marble plinth, left |
| 03 | Ruby Cascade Necklace | lit glass case, velvet bust, left alcove 1 |
| 04 | Gold Satin Crystal Pumps | velvet stairs, right alcove 1 |
| 05 | Gold Dress Watch | lit glass case, ivory cushion, left alcove 2 |
| 06 | Navy Velvet Embroidered Blazer | gilt dress form, right |
| 07 | Navy Velvet Crest Loafers | velvet stairs, right alcove 3 |
| 08 | Ruby Chandelier Earrings | lit glass case, gilt stand, left alcove 3 |
| 09 | Crystal Flacon Parfum | lit glass case, black lacquer riser, right alcove 2 |
| 10 | Baroque Silk Twill Scarf | gilt rail, right |
