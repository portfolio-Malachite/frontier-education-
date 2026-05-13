const CONFIG = {
  OWNER_EMAIL: 'frontierteam68@gmail.com',
  SPREADSHEET_ID: '1EcuyygiGzoUfFBR2FzbF8ci7brAUPcW132RRgwt6B5Y',
  SHEET_NAME: 'Enquiries',
  TIMEZONE: 'Asia/Kolkata',
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
  'Nationality',
  'Preferred Course'
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
    sendInstantNotification_(sheet);

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
  const sheetUrl = getSheetUrl_(sheet);
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
      [
        'No enquiries were received today.',
        '',
        'View all enquiries here:',
        sheetUrl
      ].join('\n'),
      {
        htmlBody: `
          <p>No enquiries were received today.</p>
          <p>Date: <strong>${escapeHtml_(subjectDate)}</strong></p>
          <p>View all enquiries here:</p>
          <p><a href="${escapeHtml_(sheetUrl)}">${escapeHtml_(sheetUrl)}</a></p>
        `
      }
    );
    return;
  }

  const plainBody = [
    `A daily Frontier Education enquiry summary is ready for ${subjectDate}.`,
    '',
    'View all enquiries here:',
    sheetUrl
  ].join('\n');

  GmailApp.sendEmail(
    CONFIG.OWNER_EMAIL,
    subject,
    plainBody,
    {
      htmlBody: `
        <p>A daily Frontier Education enquiry summary is ready for <strong>${escapeHtml_(subjectDate)}</strong>.</p>
        <p>View all enquiries here:</p>
        <p><a href="${escapeHtml_(sheetUrl)}">${escapeHtml_(sheetUrl)}</a></p>
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
  spreadsheet.setSpreadsheetTimeZone(CONFIG.TIMEZONE);
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

  sheet.getRange('A:A').setNumberFormat('dd mmm yyyy, hh:mm am/pm');

  return sheet;
}

function appendEnquiryRow_(sheet, submittedAt, payload) {
  sheet.appendRow([
    submittedAt,
    payload.fullName,
    payload.email,
    payload.phone,
    payload.nationality,
    payload.preferredCourse
  ]);
}

function getSheetUrl_(sheet) {
  return `${sheet.getParent().getUrl()}#gid=${sheet.getSheetId()}`;
}

function sendInstantNotification_(sheet) {
  const subject = 'New Frontier Education Enquiry';
  const sheetUrl = getSheetUrl_(sheet);

  const plainBody = [
    'A new enquiry has been received.',
    '',
    'View all enquiries here:',
    sheetUrl
  ].join('\n');

  const htmlBody = `
    <p>A new enquiry has been received.</p>
    <p>View all enquiries here:</p>
    <p><a href="${escapeHtml_(sheetUrl)}">${escapeHtml_(sheetUrl)}</a></p>
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
    nationality: sanitiseText_(source.nationality, 160),
    preferredCourse: sanitiseText_(source.preferredCourse || source.campus, 80),
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

  if (!payload.fullName || !payload.email || !payload.phone || !payload.nationality || !payload.preferredCourse) {
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
    payload.nationality,
    payload.preferredCourse
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
