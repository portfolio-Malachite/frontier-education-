const { Resend } = require("resend");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS = ["fullName", "email", "phone", "nationality", "course"];

const normaliseInput = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (typeof body !== "string") return {};

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const buildPayload = (rawPayload) => ({
  fullName: normaliseInput(rawPayload.fullName),
  email: normaliseInput(rawPayload.email).toLowerCase(),
  phone: normaliseInput(rawPayload.phone),
  nationality: normaliseInput(rawPayload.nationality),
  course: normaliseInput(rawPayload.course),
  siteOrigin: normaliseInput(rawPayload.siteOrigin),
  pageUrl: normaliseInput(rawPayload.pageUrl)
});

const getValidationError = (payload) => {
  const missingField = REQUIRED_FIELDS.find((field) => !payload[field]);
  if (missingField) return "Please complete all required fields.";

  if (!EMAIL_REGEX.test(payload.email)) return "Please enter a valid email address.";

  const phoneDigits = payload.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7) return "Please enter a valid phone number.";

  return "";
};

const buildTextBody = (payload) => [
  "New Frontier Education consultation enquiry",
  "",
  `Full name: ${payload.fullName}`,
  `Email: ${payload.email}`,
  `Phone: ${payload.phone}`,
  `Nationality: ${payload.nationality}`,
  `Preferred course: ${payload.course}`,
  "",
  `Site origin: ${payload.siteOrigin || "Not provided"}`,
  `Page URL: ${payload.pageUrl || "Not provided"}`
].join("\n");

const buildHtmlBody = (payload) => `
  <h2>New Frontier Education consultation enquiry</h2>
  <p><strong>Full name:</strong> ${escapeHtml(payload.fullName)}</p>
  <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
  <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
  <p><strong>Nationality:</strong> ${escapeHtml(payload.nationality)}</p>
  <p><strong>Preferred course:</strong> ${escapeHtml(payload.course)}</p>
  <hr />
  <p><strong>Site origin:</strong> ${escapeHtml(payload.siteOrigin || "Not provided")}</p>
  <p><strong>Page URL:</strong> ${escapeHtml(payload.pageUrl || "Not provided")}</p>
`;

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, status: "error", error: "Method not allowed." });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  const resendToEmail = process.env.RESEND_TO_EMAIL;

  if (!resendApiKey || !resendFromEmail || !resendToEmail) {
    return res.status(500).json({
      ok: false,
      status: "error",
      error: "Email service is not configured."
    });
  }

  const payload = buildPayload(parseBody(req.body));
  const validationError = getValidationError(payload);

  if (validationError) {
    return res.status(400).json({
      ok: false,
      status: "error",
      error: validationError
    });
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [resendToEmail],
      replyTo: payload.email,
      subject: "New Frontier Education Consultation Enquiry",
      text: buildTextBody(payload),
      html: buildHtmlBody(payload)
    });

    if (error) {
      console.error("Resend email error:", error);
      return res.status(502).json({
        ok: false,
        status: "error",
        error: "Unable to send enquiry right now. Please try again."
      });
    }

    return res.status(200).json({
      ok: true,
      status: "success",
      id: data?.id || null
    });
  } catch (error) {
    console.error("Unhandled contact API error:", error);
    return res.status(500).json({
      ok: false,
      status: "error",
      error: "Unable to send enquiry right now. Please try again."
    });
  }
};
