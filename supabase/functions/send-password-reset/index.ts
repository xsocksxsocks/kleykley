import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

// HTML escape function to prevent XSS in email content
const escapeHtml = (text: string | undefined | null): string => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    console.log("Password reset request for:", email?.substring(0, 30));

    if (!email) {
      throw new Error("Email is required");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error checking user:", userError);
    }

    const userExists = userData?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());

    // Always return success to prevent email enumeration
    if (!userExists) {
      console.log("User not found, returning success anyway for security");
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a reset link has been sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate password reset link using Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      throw new Error("Failed to generate reset link");
    }

    const resetLink = linkData?.properties?.action_link;

    if (!resetLink) {
      throw new Error("Failed to generate reset link");
    }

    // Get user's name from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .maybeSingle();

    const userName = escapeHtml(profileData?.full_name) || 'Kunde';

    // Send custom email via Resend
    const emailResponse = await resend.emails.send({
      from: "Kley Kundenportal <noreply@kley-kanzlei.com>",
      to: [email],
      subject: "Passwort zurücksetzen - Kley Kundenportal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Passwort zurücksetzen</h2>
          <p>Sehr geehrte/r ${userName},</p>
          <p>Sie haben angefordert, Ihr Passwort für das Kley Kundenportal zurückzusetzen.</p>
          <p>Klicken Sie auf den folgenden Button, um ein neues Passwort festzulegen:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #b8860b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Neues Passwort festlegen
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px;">Dieser Link ist 1 Stunde gültig. Falls Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren.</p>
          
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

    console.log("Password reset email sent:", emailResponse);

    // Log the email
    await supabase
      .from('email_logs')
      .insert({
        recipient_email: email,
        recipient_name: profileData?.full_name || null,
        notification_type: 'password_reset',
        subject: 'Passwort zurücksetzen - Kley Kundenportal',
        status: emailResponse.error ? 'failed' : 'sent',
        error_message: emailResponse.error?.message || null,
        metadata: {
          resend_id: emailResponse.data?.id,
        },
      });

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);

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
