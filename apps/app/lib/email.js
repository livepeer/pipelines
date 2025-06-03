"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const env_1 = require("./env");
async function sendEmail({ to, subject, html }) {
  if (!env_1.config.sendgrid?.apiKey) {
    console.warn("SendGrid API key not configured. Email not sent.");
    return;
  }
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env_1.config.sendgrid.apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: { email: "noreply@daydream.com" },
      content: [{ type: "text/html", value: html }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}
