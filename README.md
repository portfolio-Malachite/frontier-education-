# Frontier Education Website

Static HTML/CSS/JS landing page with a Vercel serverless contact API using Resend for email delivery.

## Project Structure

- `index.html`
- `style.css`
- `script.js`
- `api/contact.js`
- `package.json`
- `assets/`
- `images/`
- `vercel.json`

## Contact Form Flow

1. Frontend validates the enquiry form in `script.js`.
2. Frontend submits JSON to `/api/contact`.
3. `api/contact.js` validates payload and sends the enquiry email through Resend.
4. API responds with `{ ok: true, status: "success" }` so the existing success message flow is preserved.

## Environment Variables

Configure these in Vercel Project Settings (and optionally in local `.env` for local testing):

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`

Do not commit real secrets to the repository.

## Local Development

```bash
npm install
npm run check
npm run dev
```

## Vercel Deployment

Use these settings:

- **Framework Preset:** Other
- **Build Command:** Empty
- **Output Directory:** Empty

Set environment variables in Vercel before deploying so `api/contact.js` can send emails successfully.
