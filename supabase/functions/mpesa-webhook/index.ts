import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

serve(async (req) => {
    // M-Pesa webhooks are strictly server-to-server, so CORS isn't strictly necessary,
    // but we add basic handling just in case.
    try {
        const payload = await req.json();
        console.log("[M-Pesa Webhook] Received payload:", JSON.stringify(payload, null, 2));

        // Initialize Supabase Admin Client to bypass RLS for webhook processing
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Safety check - we shouldn't execute without keys
        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn("Missing Supabase environment variables. Skipping DB update.");
        } else {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // TODO: Map M-Pesa Daraja API payload to our database
            // Extracted variables typically look like: ResultCode, ResultDesc, CallbackMetadata
            // Example: Update payment status in 'transactions' table
            /*
            await supabase
                .from('transactions')
                .update({ status: 'completed', receipt: 'XYZ123' })
                .eq('checkout_request_id', checkoutRequestId);
            */
            console.log("Would update database with service key.");
        }

        // Safaricom expects a successful response to stop sending retries
        return new Response(
            JSON.stringify({ "ResultCode": 0, "ResultDesc": "Success" }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
        )
    } catch (error: any) {
        console.error("Error processing M-Pesa Webhook:", error.message)
        // Even on error, we might want to return 200 to Safaricom to prevent infinite retries
        // unless it's a format we explicitly want them to retry.
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
