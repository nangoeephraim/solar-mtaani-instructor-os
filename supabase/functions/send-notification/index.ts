import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"

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

        const notificationType = type || 'push';
        const results: Record<string, any> = {};
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // --- SMS Delivery ---
        if (notificationType === 'sms') {
            const phoneNumber = payload?.phone || payload?.phoneNumber;
            if (!phoneNumber) {
                throw new Error("SMS notification requires payload.phone or payload.phoneNumber");
            }

            // Call the existing send-sms edge function
            const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms', {
                body: { to: phoneNumber, message: `${title}: ${body}` }
            });

            if (smsError) {
                console.error(`[Notification Service] SMS delivery failed:`, smsError);
                results.sms = { success: false, error: smsError.message };
            } else {
                console.log(`[Notification Service] SMS sent to ${phoneNumber}:`, smsData);
                results.sms = { success: true, messageId: smsData?.messageId };
            }
        }

        // --- Push Delivery via Supabase Realtime Broadcast ---
        if (notificationType === 'push' || notificationType === 'all') {
            // Broadcast the notification to the user's realtime channel.
            // The client-side notificationService.subscribeToUserNotifications() listens
            // on this channel and shows a native browser/SW notification.
            const channel = supabase.channel(`user-notifications-${userId}`);

            await channel.send({
                type: 'broadcast',
                event: 'notification',
                payload: {
                    title,
                    body,
                    category: payload?.category || 'general',
                    url: payload?.url || '/',
                    data: payload?.data || {},
                    timestamp: new Date().toISOString()
                }
            });

            // Clean up the channel after sending
            await supabase.removeChannel(channel);

            console.log(`[Notification Service] Push broadcast sent to user ${userId}`);
            results.push = { success: true };
        }

        // --- Both SMS + Push ---
        if (notificationType === 'all') {
            // SMS was already handled above if 'all' was specified and phone exists
            if (payload?.phone || payload?.phoneNumber) {
                const phoneNumber = payload.phone || payload.phoneNumber;
                const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms', {
                    body: { to: phoneNumber, message: `${title}: ${body}` }
                });

                if (smsError) {
                    results.sms = { success: false, error: smsError.message };
                } else {
                    results.sms = { success: true, messageId: smsData?.messageId };
                }
            }
        }

        const overallSuccess = Object.values(results).some((r: any) => r.success);

        const result = {
            success: overallSuccess,
            message: overallSuccess
                ? "Notification successfully delivered."
                : "Notification delivery failed.",
            type: notificationType,
            channels: results,
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
