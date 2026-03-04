// M-Pesa STK Push Edge Function (Supabase)
// Deploy with: supabase functions deploy mpesa-stk-push
//
// Required secrets (set via `supabase secrets set`):
//   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
//   MPESA_SHORTCODE, MPESA_PASSKEY,
//   MPESA_CALLBACK_URL, MPESA_ENV (sandbox | production)
//
// This is a scaffold — deploy to your Supabase project.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { phoneNumber, amount, studentId, studentName, recordedBy, feeStructureId, term, accountReference, transactionDesc } = await req.json();

        const env = Deno.env.get('MPESA_ENV') || 'sandbox';
        const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!;
        const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!;
        const shortcode = Deno.env.get('MPESA_SHORTCODE')!;
        const passkey = Deno.env.get('MPESA_PASSKEY')!;
        const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL')!;

        const baseUrl = env === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        // Step 1: Get OAuth token
        const authString = btoa(`${consumerKey}:${consumerSecret}`);
        const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { 'Authorization': `Basic ${authString}` }
        });
        const { access_token } = await tokenRes.json();

        // Step 2: Generate timestamp and password
        const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
        const password = btoa(`${shortcode}${passkey}${timestamp}`);

        // Step 3: Send STK Push
        const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phoneNumber,
                PartyB: shortcode,
                PhoneNumber: phoneNumber,
                CallBackURL: callbackUrl,
                AccountReference: accountReference || `PRISM-${studentId}`,
                TransactionDesc: transactionDesc || `Fee payment for ${studentName}`
            })
        });

        const stkResult = await stkRes.json();

        // Step 4: If successful, create a pending payment record
        if (stkResult.ResponseCode === '0') {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            );

            await supabase.from('fee_payments').insert({
                student_id: studentId,
                student_name: studentName,
                amount: amount,
                method: 'mpesa',
                status: 'pending',
                mpesa_phone_number: phoneNumber,
                fee_structure_id: feeStructureId || null,
                term: term || null,
                recorded_by: recordedBy,
                notes: `STK Push - CheckoutRequestID: ${stkResult.CheckoutRequestID}`
            });
        }

        return new Response(JSON.stringify(stkResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
