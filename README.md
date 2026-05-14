# Frontier Education Static Website

Static HTML, CSS, and JavaScript rebuild of the Frontier Education landing page with a Google Apps Script powered enquiry form.

## Project Structure

- `index.html`
- `style.css`
- `script.js`
- `Code.gs`
- `assets/`
- `images/`
- `vercel.json`

## Google Apps Script Setup

1. Open [Google Apps Script](https://script.google.com/).
2. Create a new project.
3. Replace the default script with the contents of `Code.gs`.
4. In `Code.gs`, replace `shahrukhoffice.works@gmail.com` if you want enquiries sent to a different Gmail address.
5. Click **Deploy** > **New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to **Me**.
8. Set **Who has access** to **Anyone**.
9. Click **Deploy** and approve the Gmail/MailApp permissions.
10. Copy the generated Web App URL.
11. Open `script.js` and paste the Web App URL here:

```js
const GOOGLE_APPS_SCRIPT_WEB_APP_URL = "GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

## Website Deployment

### GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings** > **Pages**.
3. Select the branch that contains `index.html`.
4. Use the repository root as the publish folder.
5. Save and wait for GitHub Pages to publish the site.

### Vercel

Use these settings:

- **Framework Preset:** Other
- **Build Command:** Empty
- **Output Directory:** Empty

The included `vercel.json` keeps deployment static-friendly.
