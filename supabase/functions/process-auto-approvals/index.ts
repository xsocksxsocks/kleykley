import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify CRON_SECRET for scheduled function security
  const authHeader = req.headers.get('authorization');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!expectedSecret || !authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    console.error('Unauthorized access attempt to process-auto-approvals');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we're within business hours (8-20 Berlin time)
    const berlinTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Europe/Berlin', 
      hour: 'numeric', 
      hour12: false 
    });
    const currentHour = parseInt(berlinTime);
    
    if (currentHour < 8 || currentHour >= 20) {
      console.log(`Outside business hours (${currentHour}:00 Berlin). Skipping auto-approvals.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          approved_count: 0,
          message: `Outside business hours (8-20). No approvals processed.`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // First, get users who are about to be approved (before the update)
    const { data: pendingUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, scheduled_approval_at')
      .eq('approval_status', 'pending')
      .lte('scheduled_approval_at', new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching pending users:", fetchError);
    }

    console.log(`Found ${pendingUsers?.length || 0} users pending approval`);

    // Call the database function to process auto-approvals
    const { data, error } = await supabase.rpc('process_auto_approvals');

    if (error) {
      console.error("Error processing auto-approvals:", error);
      throw error;
    }

    console.log(`Auto-approval processed. Approved count: ${data}`);

    // Send welcome emails to newly approved users
    let emailsSent = 0;
    if (pendingUsers && pendingUsers.length > 0 && data > 0) {
      for (const user of pendingUsers) {
        try {
          const customerName = user.full_name || user.company_name || 'Kunde';
          
          console.log(`Sending approval email to: ${user.email}`);
          
          const emailResponse = await resend.emails.send({
            from: "Kley Kundenportal <noreply@kley-kanzlei.com>",
            to: [user.email],
            subject: "Ihr Konto wurde freigeschaltet",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Gute Nachrichten, ${customerName}!</h2>
                <p>Ihr Konto im Kley Kundenportal wurde erfolgreich freigeschaltet.</p>
                <p>Sie können jetzt:</p>
                <ul>
                  <li>Produkte und Fahrzeuge ansehen</li>
                  <li>Unverbindliche Angebotsanfragen senden</li>
                  <li>Ihre Dokumente einsehen</li>
                </ul>
                <p><a href="https://kley-kanzlei.com/portal" style="display: inline-block; background-color: #b8860b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zum Kundenportal</a></p>
                <br>
                <p>Mit freundlichen Grüßen,<br>Ihr Kley Team</p>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">
                  Kley Rechtsanwalt GmbH<br>
                  Eiderkamp 13, 24582 Bordesholm<br>
                  Tel: +49 (0) 4322 123 4567<br>
                  E-Mail: info@kley-kanzlei.com
                </p>
              </div>
            `,
          });

          console.log(`Approval email sent to ${user.email}:`, emailResponse);
          emailsSent++;

          // Log the email
          await supabase.from('email_logs').insert({
            recipient_email: user.email,
            recipient_name: customerName,
            subject: "Ihr Konto wurde freigeschaltet",
            notification_type: 'auto_approval',
            status: 'sent',
            metadata: { user_id: user.id, resend_id: emailResponse.data?.id }
          });

        } catch (emailError) {
          console.error(`Failed to send approval email to ${user.email}:`, emailError);
          
          // Log the failed email
          await supabase.from('email_logs').insert({
            recipient_email: user.email,
            recipient_name: user.full_name || user.company_name || 'Kunde',
            subject: "Ihr Konto wurde freigeschaltet",
            notification_type: 'auto_approval',
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
            metadata: { user_id: user.id }
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        approved_count: data,
        emails_sent: emailsSent,
        message: `Successfully processed auto-approvals. ${data} users approved, ${emailsSent} emails sent.`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-auto-approvals function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
