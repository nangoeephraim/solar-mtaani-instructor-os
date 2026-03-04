// M-Pesa Callback Edge Function (Supabase)
// Deploy with: supabase functions deploy mpesa-callback
//
// This endpoint receives payment confirmation callbacks from Safaricom.
// Set MPESA_CALLBACK_URL to this function's public URL.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    try {
        const body = await req.json();
        const callback = body?.Body?.stkCallback;

        if (!callback) {
            return new Response(JSON.stringify({ error: 'Invalid callback format' }), { status: 400 });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const checkoutRequestId = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode;

        if (resultCode === 0) {
            // Payment successful
            const items = callback.CallbackMetadata?.Item || [];
            const receiptNumber = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
            const amount = items.find((i: any) => i.Name === 'Amount')?.Value;
            const phoneNumber = items.find((i: any) => i.Name === 'PhoneNumber')?.Value?.toString();

            // Update the pending payment to completed
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
                    status: 'completed',
                    mpesa_receipt_number: receiptNumber,
                    mpesa_phone_number: phoneNumber,
                    amount: amount,
                    transaction_date: new Date().toISOString()
                }).eq('id', pending.id);
            }
        } else {
            // Payment failed or cancelled
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
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('M-Pesa callback error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
