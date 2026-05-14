const RECIPIENT_EMAIL = "shahrukhoffice.works@gmail.com";
const EMAIL_SUBJECT = "New Website Enquiry - Frontier Education";

function doPost(e) {
  try {
    const data = parseRequestBody(e);
    const submittedAt = new Date();
    const submittedTime = Utilities.formatDate(
      submittedAt,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm:ss"
    );

    validateRequiredFields(data);

    const emailBody = [
      "New enquiry submitted from the Frontier Education website.",
      "",
      "Full Name: " + cleanValue(data.fullName),
      "Email: " + cleanValue(data.email),
      "Phone: " + cleanValue(data.phone),
      "Nationality: " + cleanValue(data.nationality),
      "Preferred Course: " + cleanValue(data.course),
      "Submitted Date & Time: " + submittedTime
    ].join("\n");

    const mailOptions = {
      to: RECIPIENT_EMAIL,
      subject: EMAIL_SUBJECT,
      body: emailBody,
      name: "Frontier Education Enquiry"
    };

    const replyTo = cleanValue(data.email);
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    MailApp.sendEmail(mailOptions);

    return jsonResponse({
      status: "success",
      message: "Enquiry sent successfully."
    });
  } catch (error) {
    return jsonResponse({
      status: "error",
      message: error && error.message ? error.message : "Unable to send enquiry."
    });
  }
}

function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }

  return JSON.parse(e.postData.contents);
}

function validateRequiredFields(data) {
  const requiredFields = ["fullName", "email", "phone", "nationality", "course"];
  const missingFields = requiredFields.filter(function(field) {
    return !cleanValue(data[field]);
  });

  if (missingFields.length) {
    throw new Error("Missing required fields: " + missingFields.join(", "));
  }
}

function cleanValue(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
