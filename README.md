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

The enquiry form is wired for a Google Apps Script backend. Follow the full setup guide in [google-apps-script/SETUP.md](./google-apps-script/SETUP.md).

## Notes

- The site is built with plain HTML, CSS, and JavaScript.
- The frontend now shows only production form messages:
  - Success: `Thank you! Your enquiry has been submitted successfully.`
  - Error: `Something went wrong. Please try again.`
- The form backend expects a deployed Google Apps Script web app `/exec` URL in the `data-script-url` attribute on the enquiry form.
