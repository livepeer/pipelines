import { config } from "./env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!config.sendgrid?.apiKey) {
    console.warn("SendGrid API key not configured. Email not sent.");
    return;
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.sendgrid.apiKey}`,
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
