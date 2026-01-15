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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactFormRequest = await req.json();

    console.log("Received contact form submission:", { name, email, subject });

    // Send notification email to the law firm
    const notificationEmail = await resend.emails.send({
      from: "Kontaktformular <noreply@kley-kanzlei.com>",
      to: ["info@kley-kanzlei.com"],
      subject: `Neue Kontaktanfrage: ${subject}`,
      html: `
        <h2>Neue Kontaktanfrage über die Website</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone || "Nicht angegeben"}</p>
        <p><strong>Betreff:</strong> ${subject}</p>
        <h3>Nachricht:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    console.log("Notification email sent:", notificationEmail);

    // Send confirmation email to the sender
    const confirmationEmail = await resend.emails.send({
      from: "Kley Rechtsanwalt GmbH <noreply@kley-kanzlei.com>",
      to: [email],
      subject: "Ihre Anfrage bei Kley Rechtsanwalt GmbH",
      html: `
        <h2>Vielen Dank für Ihre Nachricht, ${name}!</h2>
        <p>Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.</p>
        <h3>Ihre Nachricht:</h3>
        <p><strong>Betreff:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, "<br>")}</p>
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
