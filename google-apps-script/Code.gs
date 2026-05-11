const CONFIG = {
  OWNER_EMAIL: 'adityakumarasd852@gmail.com',
  SPREADSHEET_ID: '1EcuyygiGzoUfFBR2FzbF8ci7brAUPcW132RRgwt6B5Y',
  SHEET_NAME: 'Enquiries',
  TIMEZONE: 'Australia/Brisbane',
  DAILY_SUMMARY_HOUR: 18,
  ALLOWED_SITE_ORIGINS: [
    'https://portfolio-malachite.github.io',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  HONEYPOT_FIELD: 'website',
  DUPLICATE_CACHE_TTL_SECONDS: 120
};

const SUCCESS_MESSAGE = 'Thank you! Your enquiry has been submitted successfully.';
const ERROR_MESSAGE = 'Something went wrong. Please try again.';

const SHEET_HEADERS = [
  'Timestamp',
  'Full Name',
  'Email Address',
  'Phone Number',
  'Preferred Course',
  'Preferred Campus'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'Frontier Education enquiry endpoint is running.'
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    const payload = normalisePayload_(e);
    const validation = validatePayload_(payload);

    if (!validation.ok) {
      return jsonResponse_({
        ok: false,
        message: validation.message
      });
    }

    if (payload.isSpam) {
      return jsonResponse_({
        ok: true,
        message: SUCCESS_MESSAGE
      });
    }

    lock.waitLock(10000);
    assertConfigured_();
    ensureDailySummaryTrigger_();

    const duplicate = checkDuplicateSubmission_(payload);
    if (duplicate) {
      return jsonResponse_({
        ok: true,
        message: SUCCESS_MESSAGE
      });
    }

    const sheet = getOrCreateSheet_();
    const submittedAt = new Date();

    appendEnquiryRow_(sheet, submittedAt, payload);
    sendInstantNotification_(submittedAt, payload);

    return jsonResponse_({
      ok: true,
      message: SUCCESS_MESSAGE
    });
  } catch (error) {
    console.error('Enquiry submission failed', error);

    return jsonResponse_({
      ok: false,
      message: ERROR_MESSAGE
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (releaseError) {
      console.warn('Lock release skipped', releaseError);
    }
  }
}

function setupProject() {
  assertConfigured_();
  getOrCreateSheet_();
  ensureDailySummaryTrigger_();
}

function sendDailySummaryEmail() {
  assertConfigured_();

  const sheet = getOrCreateSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);
  const todayKey = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd');

  const todaysEntries = rows.filter((row) => {
    const timestamp = row[0];
    if (!(timestamp instanceof Date)) return false;

    return Utilities.formatDate(timestamp, CONFIG.TIMEZONE, 'yyyy-MM-dd') === todayKey;
  });

  const subjectDate = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd MMM yyyy');
  const subject = `Daily Frontier Education Enquiry Summary - ${subjectDate}`;

  if (!todaysEntries.length) {
    GmailApp.sendEmail(
      CONFIG.OWNER_EMAIL,
      subject,
      'No enquiries were received today.',
      {
        htmlBody: `
          <p>No enquiries were received today.</p>
          <p>Date: <strong>${escapeHtml_(subjectDate)}</strong></p>
        `
      }
    );
    return;
  }

  const htmlRows = todaysEntries.map((row) => {
    const timestamp = formatTimestamp_(row[0]);

    return `
      <tr>
        <td style="padding:10px;border:1px solid #dbe8eb;">${escapeHtml_(timestamp)}</td>
        <td style="padding:10px;border:1px solid #dbe8eb;">${escapeHtml_(row[1])}</td>
        <td style="padding:10px;border:1px solid #dbe8eb;">${escapeHtml_(row[2])}</td>
        <td style="padding:10px;border:1px solid #dbe8eb;">${escapeHtml_(row[3])}</td>
        <td style="padding:10px;border:1px solid #dbe8eb;">${escapeHtml_(row[4])}</td>
        <td style="padding:10px;border:1px solid #dbe8eb;">${escapeHtml_(row[5])}</td>
      </tr>
    `;
  }).join('');

  const plainBody = todaysEntries.map((row, index) => {
    return [
      `${index + 1}. ${row[1]}`,
      `   Email: ${row[2]}`,
      `   Phone: ${row[3]}`,
      `   Preferred Course: ${row[4]}`,
      `   Preferred Campus: ${row[5]}`,
      `   Submitted: ${formatTimestamp_(row[0])}`
    ].join('\n');
  }).join('\n\n');

  GmailApp.sendEmail(
    CONFIG.OWNER_EMAIL,
    subject,
    plainBody,
    {
      htmlBody: `
        <p>Here is your daily Frontier Education enquiry summary for <strong>${escapeHtml_(subjectDate)}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">
          <thead>
            <tr>
              <th style="padding:10px;border:1px solid #dbe8eb;background:#eef7fb;text-align:left;">Timestamp</th>
              <th style="padding:10px;border:1px solid #dbe8eb;background:#eef7fb;text-align:left;">Full Name</th>
              <th style="padding:10px;border:1px solid #dbe8eb;background:#eef7fb;text-align:left;">Email Address</th>
              <th style="padding:10px;border:1px solid #dbe8eb;background:#eef7fb;text-align:left;">Phone Number</th>
              <th style="padding:10px;border:1px solid #dbe8eb;background:#eef7fb;text-align:left;">Preferred Course</th>
              <th style="padding:10px;border:1px solid #dbe8eb;background:#eef7fb;text-align:left;">Preferred Campus</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      `
    }
  );
}

function ensureDailySummaryTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  const existingTrigger = triggers.some((trigger) => trigger.getHandlerFunction() === 'sendDailySummaryEmail');

  if (existingTrigger) {
    return;
  }

  ScriptApp.newTrigger('sendDailySummaryEmail')
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.DAILY_SUMMARY_HOUR)
    .create();
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  const existingHeaders = headerRange.getValues()[0];
  const needsHeaders = SHEET_HEADERS.some((header, index) => existingHeaders[index] !== header);

  if (needsHeaders) {
    headerRange.setValues([SHEET_HEADERS]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#eef7fb');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, SHEET_HEADERS.length);
  }

  return sheet;
}

function appendEnquiryRow_(sheet, submittedAt, payload) {
  sheet.appendRow([
    submittedAt,
    payload.fullName,
    payload.email,
    payload.phone,
    payload.course,
    payload.campus
  ]);
}

function sendInstantNotification_(submittedAt, payload) {
  const subject = 'New Frontier Education Enquiry';
  const formattedTime = formatTimestamp_(submittedAt);

  const plainBody = [
    'A new Frontier Education enquiry has been received.',
    '',
    `Full Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone Number: ${payload.phone}`,
    `Preferred Course: ${payload.course}`,
    `Preferred Campus: ${payload.campus}`,
    `Submission Time: ${formattedTime}`
  ].join('\n');

  const htmlBody = `
    <p>A new Frontier Education enquiry has been received.</p>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:8px 12px;border:1px solid #dbe8eb;"><strong>Full Name</strong></td><td style="padding:8px 12px;border:1px solid #dbe8eb;">${escapeHtml_(payload.fullName)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #dbe8eb;"><strong>Email</strong></td><td style="padding:8px 12px;border:1px solid #dbe8eb;">${escapeHtml_(payload.email)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #dbe8eb;"><strong>Phone Number</strong></td><td style="padding:8px 12px;border:1px solid #dbe8eb;">${escapeHtml_(payload.phone)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #dbe8eb;"><strong>Preferred Course</strong></td><td style="padding:8px 12px;border:1px solid #dbe8eb;">${escapeHtml_(payload.course)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #dbe8eb;"><strong>Preferred Campus</strong></td><td style="padding:8px 12px;border:1px solid #dbe8eb;">${escapeHtml_(payload.campus)}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #dbe8eb;"><strong>Submission Time</strong></td><td style="padding:8px 12px;border:1px solid #dbe8eb;">${escapeHtml_(formattedTime)}</td></tr>
    </table>
  `;

  GmailApp.sendEmail(CONFIG.OWNER_EMAIL, subject, plainBody, { htmlBody });
}

function normalisePayload_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const contentType = e && e.postData ? e.postData.type : '';
  let bodyParams = {};

  if (contentType && contentType.indexOf('application/json') === 0 && e.postData.contents) {
    bodyParams = JSON.parse(e.postData.contents);
  }

  const source = Object.assign({}, bodyParams, params);
  const siteOrigin = sanitiseText_(source.siteOrigin, 200);
  const pageUrl = sanitiseText_(source.pageUrl, 500);
  const honeypotValue = sanitiseText_(source[CONFIG.HONEYPOT_FIELD], 200);

  return {
    fullName: sanitiseText_(source.fullName, 120),
    email: sanitiseText_(source.email, 160).toLowerCase(),
    phone: sanitiseText_(source.phone, 40),
    course: sanitiseText_(source.course, 160),
    campus: sanitiseText_(source.campus, 80),
    siteOrigin,
    pageUrl,
    honeypotValue,
    isSpam: Boolean(honeypotValue)
  };
}

function validatePayload_(payload) {
  if (payload.isSpam) {
    return { ok: true };
  }

  if (payload.siteOrigin && CONFIG.ALLOWED_SITE_ORIGINS.length && CONFIG.ALLOWED_SITE_ORIGINS.indexOf(payload.siteOrigin) === -1) {
    return { ok: false, message: 'This form origin is not allowed.' };
  }

  if (!payload.fullName || !payload.email || !payload.phone || !payload.course || !payload.campus) {
    return { ok: false, message: 'Please complete all required fields.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  const phoneDigits = payload.phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return { ok: false, message: 'Please enter a valid phone number.' };
  }

  return { ok: true };
}

function checkDuplicateSubmission_(payload) {
  const cache = CacheService.getScriptCache();
  const fingerprint = Utilities.base64EncodeWebSafe([
    payload.fullName,
    payload.email,
    payload.phone,
    payload.course,
    payload.campus
  ].join('|'));

  if (cache.get(fingerprint)) {
    return true;
  }

  cache.put(fingerprint, '1', CONFIG.DUPLICATE_CACHE_TTL_SECONDS);
  return false;
}

function assertConfigured_() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('CONFIG.SPREADSHEET_ID is not configured.');
  }

  if (!CONFIG.OWNER_EMAIL) {
    throw new Error('CONFIG.OWNER_EMAIL is not configured.');
  }
}

function sanitiseText_(value, maxLength) {
  const trimmed = String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }

  return trimmed;
}

function formatTimestamp_(value) {
  return Utilities.formatDate(new Date(value), CONFIG.TIMEZONE, 'dd MMM yyyy, hh:mm a');
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
