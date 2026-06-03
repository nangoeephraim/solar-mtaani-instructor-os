<USER_REQUEST>
So the following document has the final Sally blueprints. Check it and implement the upgrade where necessary. Thank you. Keep in mind that I just need a core engine upgrade not the UI upgrade because we were currently doing live work or good work on the UI so don't touch the UI but just work on the engine upgrade. Make sure all the API keys are properly configured and everything is fine. Thank you. (Sally Engine — Configuration & API Keys Reference Directory
This document provides a complete integration guide, credential mapping, database DDL schemas, and setup instructions to replicate or migrate the Sally Chat Companion and its associated data/execution pipeline to another application.

Sally acts as the peer-to-peer trading conversational partner and P&L sentinel. To run Sally successfully, the destination application needs the matching environment configuration, database tables, and API authentication keys detailed below.

1. Project Configuration Blueprint
The project draws credentials from three main configuration surfaces:

Local Environment File (.env.local) — for development variables.
Production Infrastructure Manifest (INFRASTRUCTURE.env) — the single source of truth for deployment.
Database Settings Table (app_settings) — for dynamic runtime switching of AI providers without requiring redeployment.
Active API Keys & Secrets Directory
Here is the directory of all access keys, API integrations, and secret values compiled from Sally's workspace.

NOTE

For security, sensitive raw tokens are masked below. You can retrieve their exact values from your local project files: 
.env.local
 or 
INFRASTRUCTURE.env
.

Environment Variable Name	Service Provider / Scope	Description	Current Value (Masked / Reference)	Config Surface
GROQ_API_KEY	Groq Cloud	Primary high-speed LLM engine (Llama 3.3 70B)	gsk_Wd0GJK...6Ps	Env Variable
CEREBRAS_API_KEY	Cerebras AI	Ultra-low-latency LLM engine (Llama 3.3 70B)	csk-f288h6...844	Env Variable
OPENROUTER_API_KEY	OpenRouter	Fallback
<truncated 6401 bytes>
 await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['ai_provider', 'groq_api_key', 'openrouter_api_key', 'gemini_api_key', 'cerebras_api_key']);
    if (data) {
      const settings = Object.fromEntries(data.map(d => [d.key, d.value]));
      if (settings.ai_provider) {
        dbProvider = settings.ai_provider as AIProviderType;
        dbKey = settings[PROVIDER_KEY_MAP[dbProvider]];
      }
    }
  } catch (err) {
    console.warn('Database configuration fetch failed, using environmental configuration.');
  }
  if (dbProvider) {
    if (dbKey) return { provider: dbProvider, apiKey: dbKey };
    const envKey = process.env[PROVIDER_ENV_MAP[dbProvider]];
    if (envKey) return { provider: dbProvider, apiKey: envKey };
  }
  // Fallback Priority Sequence: Groq -> Cerebras -> OpenRouter -> Google
  const fallbackOrder: AIProviderType[] = ['groq', 'cerebras', 'openrouter', 'google'];
  for (const p of fallbackOrder) {
    const envKey = process.env[PROVIDER_ENV_MAP[p]];
    if (envKey) return { provider: p, apiKey: envKey };
  }
  return { provider: 'google', apiKey: '' };
}
4. Integration Setup Checklist for the Target Application
To quickly hook Sally up on your other application, follow this sequence:

Populate Environment Variables: Copy the keys from 
.env.local
 and apply them to your target app's deployment environment.
Execute Database Migrations: Run the DDL scripts in Section 2 to create Sally's tables and setup RLS rules.
Register Dynamic Active Engine: To initialize the database configuration, insert the default active provider in the app_settings table:
sql

INSERT INTO public.app_settings (key, value, label)
VALUES ('ai_provider', 'groq', 'Active AI Provider');
Deploy Chat Route Handler: Implement the API endpoint /api/ai/chat/route.ts using the resolved API configuration fetched by the getAIProviderConfig helper.)
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-01T10:18:52+03:00.
</ADDITIONAL_METADATA>