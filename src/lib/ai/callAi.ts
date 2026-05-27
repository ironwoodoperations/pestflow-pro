import { supabase } from '../supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'
import type { AiFeature } from './aiFeatures'

export interface AiCallInput {
  tenant_id: string | null
  max_tokens: number
  messages: { role: 'user' | 'assistant'; content: unknown }[]
  system?: string
  temperature?: number
}

export interface AnthropicResponse {
  content?: { text?: string }[]
  error?: { message?: string }
  usage?: { input_tokens?: number; output_tokens?: number }
  [k: string]: unknown
}

// Routes every Anthropic call through the ai-proxy edge function.
// Returns the Anthropic /v1/messages JSON on success. Throws on ANY non-2xx —
// proxy 400/401/403/429 OR upstream Anthropic 4xx/5xx (no 200-tunneling). The
// structured { error: { message } } body lives in FunctionsHttpError.context
// (a Response), NOT error.message — unwrap it for a useful toast.
export async function callAi(feature: AiFeature, input: AiCallInput): Promise<AnthropicResponse> {
  const { data, error } = await supabase.functions.invoke('ai-proxy', { body: { feature, ...input } })
  if (error) {
    let message = error.message ?? 'AI request failed'
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        if (body?.error?.message) message = body.error.message
      } catch { /* fall through to generic message */ }
    }
    throw new Error(message)
  }
  return data as AnthropicResponse
}
