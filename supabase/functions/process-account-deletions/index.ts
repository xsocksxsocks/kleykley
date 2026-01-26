import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify CRON_SECRET for scheduled function security
  const authHeader = req.headers.get('authorization');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!expectedSecret || !authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    console.error('Unauthorized access attempt to process-account-deletions');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting account deletion process...");

    // Find all accounts where deletion_scheduled_at has passed
    const { data: accountsToDelete, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, deletion_scheduled_at')
      .not('deletion_scheduled_at', 'is', null)
      .lte('deletion_scheduled_at', new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching accounts to delete:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${accountsToDelete?.length || 0} accounts to delete`);

    let deletedCount = 0;
    const errors: string[] = [];

    for (const account of accountsToDelete || []) {
      try {
        console.log(`Deleting account: ${account.email} (${account.id})`);
        
        // Delete the user from auth.users (this will cascade to profiles due to ON DELETE CASCADE)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(account.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${account.id}:`, deleteError);
          errors.push(`${account.email}: ${deleteError.message}`);
        } else {
          console.log(`Successfully deleted account: ${account.email}`);
          deletedCount++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Exception deleting user ${account.id}:`, errorMsg);
        errors.push(`${account.email}: ${errorMsg}`);
      }
    }

    console.log(`Account deletion process completed. Deleted: ${deletedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedCount,
        error_count: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully deleted ${deletedCount} accounts.${errors.length > 0 ? ` ${errors.length} errors occurred.` : ''}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-account-deletions function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
