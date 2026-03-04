// SMS Send Edge Function (Supabase)
// Deploy with: supabase functions deploy send-sms
//
// Required secrets (set via `supabase secrets set`):
//   AT_API_KEY    (Africa's Talking API Key)
//   AT_USERNAME   (Africa's Talking Username, e.g. 'sandbox')
//   AT_SENDER_ID  (Optional sender ID, e.g. 'PRISM')

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { to, message } = await req.json();

        const apiKey = Deno.env.get('AT_API_KEY')!;
        const username = Deno.env.get('AT_USERNAME') || 'sandbox';
        const senderId = Deno.env.get('AT_SENDER_ID') || '';

        const baseUrl = username === 'sandbox'
            ? 'https://api.sandbox.africastalking.com/version1/messaging'
            : 'https://api.africastalking.com/version1/messaging';

        const params = new URLSearchParams({
            username,
            to,
            message,
        });
        if (senderId) params.append('from', senderId);

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': apiKey,
            },
            body: params.toString(),
        });

        const result = await response.json();

        const messageData = result?.SMSMessageData?.Recipients?.[0];
        const success = messageData?.statusCode === 101;

        return new Response(JSON.stringify({
            success,
            messageId: messageData?.messageId,
            status: messageData?.status,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
