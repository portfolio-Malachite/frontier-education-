# Enquiry Form Setup

This project uses a Google Apps Script web app to:

- save each enquiry into Google Sheets
- send an instant email notification to `adityakumarasd852@gmail.com`
- send one daily summary email

## 1. Spreadsheet Setup

1. Open Google Sheets and create a new spreadsheet.
2. Keep the spreadsheet in the same Google account that will own the Apps Script project.
3. Copy the spreadsheet ID from the URL.

Example:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

4. Confirm the spreadsheet ID in `google-apps-script/Code.gs`.

The current local backend is already configured to use:

```text
1EcuyygiGzoUfFBR2FzbF8ci7brAUPcW132RRgwt6B5Y
```

## 2. Apps Script Code

1. Open [Google Apps Script](https://script.google.com/).
2. Create a new standalone project or open the existing project for this form.
3. Replace the default file contents with the code from:

```text
google-apps-script/Code.gs
```

4. Replace the manifest contents with:

```text
google-apps-script/appsscript.json
```

## 3. Required Backend Behavior

The current `Code.gs` already handles:

- required field validation
- honeypot spam protection
- duplicate submission throttling
- Google Sheets row creation
- instant Gmail notification
- daily summary trigger creation

Stored sheet columns:

1. Timestamp
2. Full Name
3. Email Address
4. Phone Number
5. Preferred Course
6. Preferred Campus

## 4. Deploy the Apps Script Web App

1. In Apps Script, click `Deploy`.
2. Choose `New deployment`.
3. Select `Web app`.
4. Set `Execute as` to your Google account.
5. Set `Who has access` to `Anyone`.
6. Click `Deploy`.
7. Complete the Google authorization prompts if asked.
8. Copy the generated web app URL that ends with:

```text
/exec
```

## 5. Connect the Frontend

1. Open `index.html`.
2. Find the enquiry form `data-script-url` attribute.
3. Replace the placeholder value with the deployed Apps Script `/exec` URL.

Example:

```html
<form
  class="enquiry-form"
  id="enquiry-form"
  novalidate
  data-script-url="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
>
```

## 6. Initialize the Backend

After saving the Apps Script project:

1. In the Apps Script editor, choose the function `setupProject`.
2. Click `Run`.
3. Authorize access when prompted.

This will:

- verify the sheet configuration
- create the `Enquiries` tab if missing
- add the header row
- create the daily summary trigger

## 7. Local Testing Steps

1. Start the local site:

```bash
python3 -m http.server 4173
```

2. Open:

```text
http://127.0.0.1:4173
```

If you prefer a Live Server-style preview, these local origins are also allowed:

```text
http://127.0.0.1:5500
http://localhost:5500
```

3. Submit a test enquiry with:
   - Full Name
   - Email Address
   - Phone Number
   - Preferred Course
   - Preferred Campus

4. Verify all of the following:
   - the form does not reload the page
   - the submit button disables during submission
   - the success message says:

```text
Thank you! Your enquiry has been submitted successfully.
```

5. Open the spreadsheet and confirm a new row was added.
6. Check `adityakumarasd852@gmail.com` and confirm the instant notification email arrived.

## 8. Daily Summary Email

The backend creates a daily trigger automatically from `setupProject()`.

Default schedule:

- timezone: `Australia/Brisbane`
- hour: `18`

You can change the summary hour in `Code.gs` here:

```js
DAILY_SUMMARY_HOUR: 18
```

## 9. Production-Safe Notes

- The frontend uses only vanilla JavaScript.
- The form shows production-only status messages.
- The backend sanitizes inputs before saving or emailing them.
- The honeypot field blocks simple bot submissions.
- Duplicate submissions are throttled for 2 minutes.
- Allowed origins currently include local development and the GitHub Pages site.

## 10. Troubleshooting

If the form shows:

```text
Something went wrong. Please try again.
```

check these items:

1. The Apps Script `/exec` URL is correctly pasted into `index.html`.
2. The web app is deployed, not just saved.
3. `setupProject()` has been run once.
4. The spreadsheet ID in `Code.gs` is valid.
5. The browser is loading the latest local files.
6. The submission origin is allowed in `Code.gs`.
