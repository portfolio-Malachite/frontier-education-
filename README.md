# Frontier Education

Static landing page for Frontier Education, ready for GitHub Pages hosting.

## Files

- `index.html` - page markup
- `style.css` - site styles
- `script.js` - navbar, CTA, form, and interaction logic
- `google-apps-script/Code.gs` - Google Apps Script backend for Sheets + Gmail
- `google-apps-script/appsscript.json` - Apps Script manifest

## Local Preview

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Form Setup

1. Deploy the Apps Script in `google-apps-script/`.
2. Copy the deployed `/exec` URL.
3. Replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` in `index.html`.
4. Replace `PASTE_YOUR_SPREADSHEET_ID_HERE` in `google-apps-script/Code.gs`.

## Notes

- The site is built with plain HTML, CSS, and JavaScript.
- The form is designed to work from GitHub Pages through a Google Apps Script web app.
