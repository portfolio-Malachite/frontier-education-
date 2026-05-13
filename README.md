# Frontier Education

Static landing page for Frontier Education, ready for local preview and GitHub Pages hosting.

## Files

- `index.html` - page markup
- `style.css` - site styles
- `script.js` - navbar, CTA, form, and interaction logic
- `google-apps-script/Code.gs` - Google Apps Script backend for Sheets + Gmail
- `google-apps-script/appsscript.json` - Apps Script manifest
- `google-apps-script/SETUP.md` - local spreadsheet, Apps Script, and deployment guide

## Local Preview

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Enquiry Form Setup

The enquiry form is prepared for Formspree delivery. Replace the placeholder endpoint in [index.html](./index.html) with the real `https://formspree.io/f/...` URL from the Formspree form connected to `frontierteam68@gmail.com`.

## Notes

- The site is built with plain HTML, CSS, and JavaScript.
- The frontend now shows only production form messages:
  - Success: `Thank you! Our team will contact you shortly.`
  - Error: `Something went wrong. Please try again.`
- The form expects a live Formspree endpoint in the `action` and `data-formspree-endpoint` attributes on the enquiry form.
