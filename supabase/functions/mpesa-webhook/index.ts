import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

serve(async (req) => {
    // M-Pesa webhooks are strictly server-to-server, so CORS isn't strictly necessary,
    // but we add basic handling just in case.
    try {
        const payload = await req.json();
        console.log("[M-Pesa Webhook] Received payload:", JSON.stringify(payload, null, 2));

        const callback = payload?.Body?.stkCallback;
        if (!callback) {
            console.warn("[M-Pesa Webhook] Invalid callback format — missing Body.stkCallback");
            return new Response(
                JSON.stringify({ "ResultCode": 1, "ResultDesc": "Invalid callback format" }),
                { headers: { "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Initialize Supabase Admin Client to bypass RLS for webhook processing
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Safety check - we shouldn't execute without keys
        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn("Missing Supabase environment variables. Skipping DB update.");
            return new Response(
                JSON.stringify({ "ResultCode": 0, "ResultDesc": "Acknowledged (no DB keys)" }),
                { headers: { "Content-Type": "application/json" }, status: 200 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const checkoutRequestId = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode;

        if (resultCode === 0) {
            // Payment successful — extract metadata from Daraja callback
            const items = callback.CallbackMetadata?.Item || [];
            const receiptNumber = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
            const amount = items.find((i: any) => i.Name === 'Amount')?.Value;
            const phoneNumber = items.find((i: any) => i.Name === 'PhoneNumber')?.Value?.toString();

            console.log(`[M-Pesa Webhook] Payment successful: Receipt=${receiptNumber}, Amount=${amount}, Phone=${phoneNumber}`);

            // Find the matching pending payment by CheckoutRequestID stored in notes
            const { data: pending } = await supabase
                .from('fee_payments')
                .select('id')
                .eq('method', 'mpesa')
                .eq('status', 'pending')
                .ilike('notes', `%${checkoutRequestId}%`)
                .limit(1)
                .single();

            if (pending) {
                const { error: updateError } = await supabase.from('fee_payments').update({
                    status: 'completed',
                    mpesa_receipt_number: receiptNumber,
                    mpesa_phone_number: phoneNumber,
                    amount: amount,
                    transaction_date: new Date().toISOString()
                }).eq('id', pending.id);

                if (updateError) {
                    console.error("[M-Pesa Webhook] Failed to update payment:", updateError.message);
                } else {
                    console.log(`[M-Pesa Webhook] Payment ${pending.id} marked as completed`);
                }
            } else {
                console.warn(`[M-Pesa Webhook] No pending payment found for CheckoutRequestID: ${checkoutRequestId}`);
            }
        } else {
            // Payment failed or was cancelled by the user
            console.log(`[M-Pesa Webhook] Payment failed/cancelled: ResultCode=${resultCode}, Desc=${callback.ResultDesc}`);

            const { data: pending } = await supabase
                .from('fee_payments')
                .select('id')
                .eq('method', 'mpesa')
                .eq('status', 'pending')
                .ilike('notes', `%${checkoutRequestId}%`)
                .limit(1)
                .single();

            if (pending) {
                await supabase.from('fee_payments').update({
                    status: resultCode === 1032 ? 'cancelled' : 'failed',
                    notes: `${callback.ResultDesc || 'Payment failed'}`
                }).eq('id', pending.id);

                console.log(`[M-Pesa Webhook] Payment ${pending.id} marked as ${resultCode === 1032 ? 'cancelled' : 'failed'}`);
            }
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
