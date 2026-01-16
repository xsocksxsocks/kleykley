import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// HTML escape function to prevent XSS in email content
const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Input validation
const validateInput = (data: ContactFormRequest): { valid: boolean; error?: string } => {
  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    return { valid: false, error: 'Name muss mindestens 2 Zeichen haben' };
  }
  if (data.name.length > 100) {
    return { valid: false, error: 'Name darf maximal 100 Zeichen haben' };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    return { valid: false, error: 'Ungültige E-Mail-Adresse' };
  }
  if (data.email.length > 255) {
    return { valid: false, error: 'E-Mail darf maximal 255 Zeichen haben' };
  }

  // Phone validation (optional)
  if (data.phone && data.phone.length > 30) {
    return { valid: false, error: 'Telefonnummer darf maximal 30 Zeichen haben' };
  }

  // Subject validation
  if (!data.subject || data.subject.trim().length < 2) {
    return { valid: false, error: 'Betreff muss mindestens 2 Zeichen haben' };
  }
  if (data.subject.length > 200) {
    return { valid: false, error: 'Betreff darf maximal 200 Zeichen haben' };
  }

  // Message validation
  if (!data.message || data.message.trim().length < 10) {
    return { valid: false, error: 'Nachricht muss mindestens 10 Zeichen haben' };
  }
  if (data.message.length > 5000) {
    return { valid: false, error: 'Nachricht darf maximal 5000 Zeichen haben' };
  }

  return { valid: true };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, phone, subject, message }: ContactFormRequest = body;

    // Validate inputs
    const validation = validateInput({ name, email, phone, subject, message });
    if (!validation.valid) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Received valid contact form submission:", { name: name.substring(0, 20), email: email.substring(0, 30), subject: subject.substring(0, 30) });

    // Escape all user inputs for safe HTML rendering
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safePhone = escapeHtml(phone?.trim() || '');
    const safeSubject = escapeHtml(subject.trim());
    const safeMessage = escapeHtml(message.trim());

    // Send notification email to the law firm
    const notificationEmail = await resend.emails.send({
      from: "Kontaktformular <noreply@kley-kanzlei.com>",
      to: ["info@kley-kanzlei.com"],
      subject: `Neue Kontaktanfrage: ${safeSubject}`,
      html: `
        <h2>Neue Kontaktanfrage über die Website</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>E-Mail:</strong> ${safeEmail}</p>
        <p><strong>Telefon:</strong> ${safePhone || "Nicht angegeben"}</p>
        <p><strong>Betreff:</strong> ${safeSubject}</p>
        <h3>Nachricht:</h3>
        <p>${safeMessage.replace(/\n/g, "<br>")}</p>
      `,
    });

    console.log("Notification email sent:", notificationEmail);

    // Send confirmation email to the sender
    const confirmationEmail = await resend.emails.send({
      from: "Kley Rechtsanwalt GmbH <noreply@kley-kanzlei.com>",
      to: [email.trim()],
      subject: "Ihre Anfrage bei Kley Rechtsanwalt GmbH",
      html: `
        <h2>Vielen Dank für Ihre Nachricht, ${safeName}!</h2>
        <p>Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.</p>
        <h3>Ihre Nachricht:</h3>
        <p><strong>Betreff:</strong> ${safeSubject}</p>
        <p>${safeMessage.replace(/\n/g, "<br>")}</p>
        <br>
        <p>Mit freundlichen Grüßen,<br>Kley Rechtsanwalt GmbH</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Eiderkamp 13, 24582 Bordesholm<br>
          Tel: +49 (0) 4322 123 4567<br>
          E-Mail: info@kanzlei-kley.com
        </p>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
