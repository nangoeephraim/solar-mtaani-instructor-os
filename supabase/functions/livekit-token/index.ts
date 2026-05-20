import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { roomName, participantName, participantId } = await req.json();

        if (!roomName || !participantName || !participantId) {
            throw new Error("Missing required parameters: roomName, participantName, participantId");
        }

        const apiKey = Deno.env.get('LIVEKIT_API_KEY');
        const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

        if (!apiKey || !apiSecret) {
            throw new Error("LiveKit credentials not configured on the server");
        }

        // LiveKit expects specific JWT structure
        const videoGrant = {
            roomJoin: true,
            room: roomName,
        };

        const secretKey = new TextEncoder().encode(apiSecret);

        const token = await new SignJWT({
            video: videoGrant,
            name: participantName,
            metadata: JSON.stringify({
                userId: participantId
            })
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuer(apiKey)
            .setSubject(participantId)
            .setNotBefore(Math.floor(Date.now() / 1000))
            .setExpirationTime('4h')
            .sign(secretKey);

        return new Response(
            JSON.stringify({ token }),
            { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400 
            }
        );
    }
});
