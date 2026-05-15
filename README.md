# Frontier Education Website

Static HTML/CSS/JS landing page with a Vercel serverless contact API using Resend for email delivery.

## Project Structure

- `index.html`
- `style.css`
- `script.js`
- `api/contact.js`
- `package.json`
- `vercel.json`
- `assets/`
- `images/`
- `google-apps-script/` (optional fallback integration)

## Contact Form Flow (Default)

1. Frontend validates the enquiry form in `script.js`.
2. Frontend submits JSON to `/api/contact`.
3. `api/contact.js` validates payload and sends enquiry email through Resend.
4. API responds with `{ ok: true, status: "success" }`.

## Environment Variables

Set these in Vercel Project Settings (and optionally local `.env`):

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`

Do not commit real secrets.

## Local Development

```bash
npm install
npm run check
npm run dev
```

## Deploy to Vercel (Fastest)

1. Import this GitHub repo into Vercel.
2. Framework preset: `Other`.
3. Build command: leave empty.
4. Output directory: leave empty.
5. Add the three environment variables above.
6. Deploy.

## Optional Google Apps Script Fallback

If you want to use Google Apps Script instead of Vercel API, setup docs are available in:

- `google-apps-script/SETUP.md`
- `google-apps-script/Code.gs`

You would then point the frontend submit URL to your deployed Apps Script endpoint.
