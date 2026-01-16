import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 
  | 'status_approved'
  | 'status_rejected'
  | 'status_pending'
  | 'order_created'
  | 'order_confirmed'
  | 'order_processing'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'document_uploaded'
  | 'welcome';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountPercentage?: number;
}

interface NotificationRequest {
  type: NotificationType;
  customerEmail: string;
  customerName: string;
  data?: {
    orderNumber?: string;
    documentName?: string;
    reason?: string;
    // Order details for order_created
    orderItems?: OrderItem[];
    totalAmount?: number;
    discountAmount?: number;
    discountCode?: string;
    billingAddress?: {
      companyName?: string;
      customerName?: string;
      address?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    shippingAddress?: {
      companyName?: string;
      customerName?: string;
      address?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    notes?: string;
    newStatus?: string;
    oldStatus?: string;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

const getEmailContent = (type: NotificationType, customerName: string, data?: NotificationRequest['data']) => {
  const name = customerName || 'Kunde';
  
  switch (type) {
    case 'welcome':
      return {
        subject: 'Willkommen im Kley Kundenportal',
        html: `
          <h2>Willkommen im Kley Kundenportal, ${name}!</h2>
          <p>Vielen Dank für Ihre Registrierung. Ihr Konto wird derzeit überprüft.</p>
          <p>Sobald Ihr Konto freigeschaltet wurde, erhalten Sie eine weitere E-Mail und können das Portal uneingeschränkt nutzen.</p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'status_approved':
      return {
        subject: 'Ihr Konto wurde freigeschaltet',
        html: `
          <h2>Gute Nachrichten, ${name}!</h2>
          <p>Ihr Konto im Kley Kundenportal wurde erfolgreich freigeschaltet.</p>
          <p>Sie können jetzt:</p>
          <ul>
            <li>Produkte und Fahrzeuge ansehen</li>
            <li>Unverbindliche Angebotsanfragen senden</li>
            <li>Ihre Dokumente einsehen</li>
          </ul>
          <p><a href="https://kleykley.lovable.app/portal" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zum Kundenportal</a></p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'status_rejected':
      return {
        subject: 'Information zu Ihrem Konto',
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Leider konnten wir Ihre Registrierung im Kundenportal derzeit nicht freischalten.</p>
          ${data?.reason ? `<p><strong>Grund:</strong> ${data.reason}</p>` : ''}
          <p>Bei Fragen wenden Sie sich bitte an unseren Kundenservice.</p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'status_pending':
      return {
        subject: 'Ihr Konto wird überprüft',
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Ihr Kontostatus wurde auf "Überprüfung" gesetzt.</p>
          <p>Wir werden Ihre Daten erneut prüfen und Sie über das Ergebnis informieren.</p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };

    case 'order_created': {
      const items = data?.orderItems || [];
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `).join('');

      const billingAddr = data?.billingAddress;
      const shippingAddr = data?.shippingAddress;

      return {
        subject: `Ihre Angebotsanfrage ${data?.orderNumber || ''} wurde empfangen`,
        html: `
          <h2>Vielen Dank für Ihre Angebotsanfrage, ${name}!</h2>
          <p>Wir haben Ihre unverbindliche Angebotsanfrage erhalten und werden diese schnellstmöglich bearbeiten.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Anfragenummer:</strong> ${data?.orderNumber || '-'}</p>
          </div>

          <h3 style="margin-top: 30px; border-bottom: 2px solid #b8860b; padding-bottom: 10px;">Angefragte Positionen</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left;">Artikel</th>
                <th style="padding: 10px; text-align: center;">Menge</th>
                <th style="padding: 10px; text-align: right;">Einzelpreis (netto)</th>
                <th style="padding: 10px; text-align: right;">Gesamt (netto)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right;">
            ${data?.discountAmount && data.discountAmount > 0 ? `
              <p style="margin: 5px 0; color: #22c55e;">
                <strong>Rabatt${data?.discountCode ? ` (${data.discountCode})` : ''}:</strong> -${formatCurrency(data.discountAmount)}
              </p>
            ` : ''}
            <p style="margin: 5px 0;"><strong>Zwischensumme (netto):</strong> ${formatCurrency(data?.totalAmount || 0)}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">zzgl. 19% MwSt.</p>
          </div>

          ${billingAddr ? `
            <h3 style="margin-top: 30px; border-bottom: 2px solid #b8860b; padding-bottom: 10px;">Rechnungsadresse</h3>
            <p style="margin: 10px 0;">
              ${billingAddr.companyName ? `<strong>${billingAddr.companyName}</strong><br>` : ''}
              ${billingAddr.customerName || ''}<br>
              ${billingAddr.address || ''}<br>
              ${billingAddr.postalCode || ''} ${billingAddr.city || ''}<br>
              ${billingAddr.country || ''}
            </p>
          ` : ''}

          ${shippingAddr && (shippingAddr.address !== billingAddr?.address) ? `
            <h3 style="margin-top: 30px; border-bottom: 2px solid #b8860b; padding-bottom: 10px;">Lieferadresse</h3>
            <p style="margin: 10px 0;">
              ${shippingAddr.companyName ? `<strong>${shippingAddr.companyName}</strong><br>` : ''}
              ${shippingAddr.customerName || ''}<br>
              ${shippingAddr.address || ''}<br>
              ${shippingAddr.postalCode || ''} ${shippingAddr.city || ''}<br>
              ${shippingAddr.country || ''}
            </p>
          ` : ''}

          ${data?.notes ? `
            <h3 style="margin-top: 30px; border-bottom: 2px solid #b8860b; padding-bottom: 10px;">Ihre Anmerkungen</h3>
            <p style="margin: 10px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">${data.notes}</p>
          ` : ''}

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #b8860b;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Hinweis:</strong> Diese Anfrage ist unverbindlich und stellt keine Bestellung dar. 
              Sie erhalten von uns ein individuelles Angebot mit den endgültigen Preisen und Lieferzeiten.
            </p>
          </div>

          <p>Sie können den Status Ihrer Anfrage jederzeit in Ihrem Kundenportal einsehen:</p>
          <p><a href="https://kleykley.lovable.app/portal/anfragen" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Meine Anfragen ansehen</a></p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
    }
      
    case 'order_confirmed':
      return {
        subject: `Angebot erstellt - ${data?.orderNumber || 'Ihre Anfrage'}`,
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Wir haben Ihre Angebotsanfrage ${data?.orderNumber ? `<strong>${data.orderNumber}</strong>` : ''} bearbeitet und ein Angebot für Sie erstellt.</p>
          <p>Sie können das Angebot in Ihrem Kundenportal unter "Meine Angebote" einsehen.</p>
          <p><a href="https://kleykley.lovable.app/portal/anfragen" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Angebot ansehen</a></p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'order_processing':
      return {
        subject: `Anfrage in Bearbeitung - ${data?.orderNumber || 'Ihre Anfrage'}`,
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Ihre Anfrage ${data?.orderNumber ? `<strong>${data.orderNumber}</strong>` : ''} befindet sich nun in Bearbeitung.</p>
          ${data?.newStatus ? `<p><strong>Neuer Status:</strong> ${data.newStatus}</p>` : ''}
          <p>Wir werden Sie über den Fortschritt informieren.</p>
          <p><a href="https://kleykley.lovable.app/portal/anfragen" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Status ansehen</a></p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'order_shipped':
      return {
        subject: `Versandbestätigung - ${data?.orderNumber || 'Ihre Bestellung'}`,
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Ihre Bestellung ${data?.orderNumber ? `<strong>${data.orderNumber}</strong>` : ''} wurde versendet.</p>
          ${data?.newStatus ? `<p><strong>Neuer Status:</strong> ${data.newStatus}</p>` : ''}
          <p>Die Versandabwicklung erfolgt gemäß den vereinbarten Konditionen. Sollten Sie noch keine detaillierten Versandinformationen erhalten haben, werden wir Ihnen diese in Kürze zukommen lassen.</p>
          <p><a href="https://kleykley.lovable.app/portal/anfragen" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Status ansehen</a></p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'order_delivered':
      return {
        subject: `Lieferung abgeschlossen - ${data?.orderNumber || 'Ihre Bestellung'}`,
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Ihre Bestellung ${data?.orderNumber ? `<strong>${data.orderNumber}</strong>` : ''} wurde erfolgreich abgeschlossen.</p>
          ${data?.newStatus ? `<p><strong>Status:</strong> ${data.newStatus}</p>` : ''}
          <p>Vielen Dank für Ihr Vertrauen!</p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'order_cancelled':
      return {
        subject: `Stornierung - ${data?.orderNumber || 'Ihre Anfrage'}`,
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Ihre Anfrage ${data?.orderNumber ? `<strong>${data.orderNumber}</strong>` : ''} wurde storniert.</p>
          ${data?.newStatus ? `<p><strong>Status:</strong> ${data.newStatus}</p>` : ''}
          ${data?.reason ? `<p><strong>Grund:</strong> ${data.reason}</p>` : ''}
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    case 'document_uploaded':
      return {
        subject: 'Neues Dokument verfügbar',
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Ein neues Dokument wurde für Sie bereitgestellt${data?.documentName ? `: <strong>${data.documentName}</strong>` : ''}.</p>
          <p>Sie können das Dokument in Ihrem Kundenportal unter "Dokumente" einsehen und herunterladen.</p>
          <p><a href="https://kleykley.lovable.app/portal/dokumente" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Dokumente ansehen</a></p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
      
    default:
      return {
        subject: 'Benachrichtigung vom Kley Kundenportal',
        html: `
          <h2>Sehr geehrte/r ${name},</h2>
          <p>Es gibt Neuigkeiten zu Ihrem Konto. Bitte melden Sie sich im Kundenportal an, um mehr zu erfahren.</p>
          <br>
          <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
        `,
      };
  }
};

const getFooter = () => `
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">
    Kley Rechtsanwalt GmbH<br>
    Eiderkamp 13, 24582 Bordesholm<br>
    Tel: +49 (0) 4322 123 4567<br>
    E-Mail: info@kley-kanzlei.com
  </p>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role for logging
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { type, customerEmail, customerName, data }: NotificationRequest = await req.json();

    console.log("Sending notification:", { type, customerEmail, customerName });

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    const { subject, html } = getEmailContent(type, customerName, data);

    const emailResponse = await resend.emails.send({
      from: "Kley Kundenportal <noreply@kley-kanzlei.com>",
      to: [customerEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${html}
          ${getFooter()}
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email to the database
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: customerEmail,
        recipient_name: customerName,
        notification_type: type,
        subject: subject,
        status: emailResponse.error ? 'failed' : 'sent',
        error_message: emailResponse.error?.message || null,
        metadata: {
          resend_id: emailResponse.data?.id,
          data: data,
        },
      });

    if (logError) {
      console.error("Failed to log email:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent", id: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-customer-notification:", error);

    // Try to log the failed email
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const body = await req.clone().json().catch(() => ({}));
      
      await supabase
        .from('email_logs')
        .insert({
          recipient_email: body.customerEmail || 'unknown',
          recipient_name: body.customerName || null,
          notification_type: body.type || 'unknown',
          subject: 'Failed to send',
          status: 'failed',
          error_message: error.message,
          metadata: { data: body.data },
        });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

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
