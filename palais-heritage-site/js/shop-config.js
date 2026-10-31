/* Store settings — fill these in once your Shopify store exists (see README, "Connect Shopify").
   Leave them empty and the site keeps working with its own cart; checkout then explains the store isn't connected yet.

   The Storefront API token is a *public* token, made for use in the browser. Never put an Admin API token here. */
export const SHOPIFY = {
  domain: '',            // e.g. 'palais-heritage.myshopify.com'
  storefrontToken: '',   // Storefront API access token (Headless channel or a custom app)
  apiVersion: '2025-01',
};

/* Contact form: paste a form endpoint (for example from Formspree) to receive requests by email.
   Left empty, the form opens the visitor's email app with the request filled in. */
export const CONTACT = {
  formEndpoint: '',
  email: 'concierge@palais-heritage.com',
};
