import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, title, body, type, payload } = await req.json()

        // Validation
        if (!userId || !title || !body) {
            throw new Error("Missing required fields: userId, title, or body.")
        }

        // TODO: Integrate with real Push Service (FCM/OneSignal) or SMS Gateway (Africa's Talking)
        console.log(`[Notification Service] Sending ${type || 'push'} to ${userId}`);
        console.log(`Title: ${title} | Body: ${body}`);
        console.log(`Payload:`, payload);

        // Mock successful delivery
        const result = {
            success: true,
            message: "Notification successfully processed and dispatched.",
            timestamp: new Date().toISOString()
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    } catch (error: any) {
        console.error("Error sending notification:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
